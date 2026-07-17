export const runtime = "nodejs";

import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

const BUCKET = "gallery";
// Per-guide photo cap. A constant so it can be bumped later (e.g. per guide tier).
const MAX_PHOTOS = 10;
const MAX_BYTES = 7 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Storage object path from a public URL produced by getPublicUrl:
// .../storage/v1/object/public/gallery/<path>
function storagePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const pathname = new URL(url).pathname;
  const i = pathname.indexOf(marker);
  if (i === -1) return null;
  return pathname.slice(i + marker.length);
}

function capExceeded() {
  return NextResponse.json(
    { error: `You can upload up to ${MAX_PHOTOS} photos. Remove one to add another.` },
    { status: 400 }
  );
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in" }, { status: 401 });
  }

  const rl = rateLimit("upload", user.id);
  if (!rl.ok) {
    return tooManyRequests(rl.retryAfterSeconds);
  }

  const guide = await prisma.guide.findUnique({ where: { userId: user.id } });
  if (!guide) {
    return NextResponse.json({ error: "You are not a guide" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }
  const ext = EXT[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported image type (use JPEG, PNG, or WebP)" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large (max 7 MB)" }, { status: 413 });
  }

  // Fast pre-check so an over-cap upload is rejected before the file
  // transfer; the transactional re-check below is the authority.
  const count = await prisma.guidePhoto.count({ where: { guideId: guide.id } });
  if (count >= MAX_PHOTOS) {
    return capExceeded();
  }

  const admin = createAdminClient();
  const path = `${user.id}/${randomUUID()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type });
  if (uploadErr) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  // Unique path per photo — no upsert, no cache-buster needed.
  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);

  // Count + create under a per-guide row lock so concurrent uploads can't
  // race past the cap between the check and the insert.
  const photo = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Guide" WHERE id = ${guide.id} FOR UPDATE`;
    const current = await tx.guidePhoto.count({ where: { guideId: guide.id } });
    if (current >= MAX_PHOTOS) return null;
    return tx.guidePhoto.create({ data: { guideId: guide.id, url: pub.publicUrl } });
  });

  if (!photo) {
    // Lost the race — drop the object we just uploaded.
    await admin.storage.from(BUCKET).remove([path]);
    return capExceeded();
  }

  return NextResponse.json({ id: photo.id, url: photo.url });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in" }, { status: 401 });
  }

  const guide = await prisma.guide.findUnique({ where: { userId: user.id } });
  if (!guide) {
    return NextResponse.json({ error: "You are not a guide" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "No photo specified" }, { status: 400 });
  }

  // Scoped to the requesting guide so nobody can delete another guide's photo.
  const photo = await prisma.guidePhoto.findFirst({ where: { id, guideId: guide.id } });
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Row first, then the object (best-effort): if the Storage remove fails we
  // leave an invisible orphan object, never a live row pointing at a deleted
  // image. deleteMany so a concurrent delete of the same photo yields
  // count 0 (→ 404) instead of an unhandled P2025 throw (→ 500).
  const { count } = await prisma.guidePhoto.deleteMany({ where: { id: photo.id } });
  if (count === 0) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const path = storagePath(photo.url);
  if (path) {
    const admin = createAdminClient();
    await admin.storage.from(BUCKET).remove([path]);
  }

  return NextResponse.json({ ok: true });
}
