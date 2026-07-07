export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "covers";
const MAX_BYTES = 7 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function coverPaths(userId: string) {
  return Object.values(EXT).map((e) => `${userId}/cover.${e}`);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in" }, { status: 401 });
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

  const admin = createAdminClient();
  const path = `${user.id}/cover.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (uploadErr) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  // Drop other-extension variants so a guide keeps at most one cover object.
  // Runs only after a successful upload so a failed upload never leaves the
  // old cover deleted while Guide.coverImage still points at it.
  const stale = coverPaths(user.id).filter((p) => p !== path);
  await admin.storage.from(BUCKET).remove(stale);

  // Deterministic path → cache-bust so a replaced cover isn't served stale.
  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  const url = `${pub.publicUrl}?v=${Date.now()}`;

  await prisma.guide.update({ where: { id: guide.id }, data: { coverImage: url } });

  return NextResponse.json({ url });
}

export async function DELETE() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in" }, { status: 401 });
  }

  const guide = await prisma.guide.findUnique({ where: { userId: user.id } });
  if (!guide) {
    return NextResponse.json({ error: "You are not a guide" }, { status: 403 });
  }

  const admin = createAdminClient();
  await admin.storage.from(BUCKET).remove(coverPaths(user.id));

  await prisma.guide.update({ where: { id: guide.id }, data: { coverImage: null } });

  return NextResponse.json({ ok: true });
}
