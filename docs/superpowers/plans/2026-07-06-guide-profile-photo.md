# Guide Profile Photo Implementation Plan (issue #25)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a guide upload / replace / remove a profile photo from the dashboard, shown on their public profile and on the guide cards, with the initial-circle as fallback.

**Architecture:** A public Supabase Storage bucket `avatars`, provisioned by a standalone idempotent script. Browser posts `FormData` to a server route that authenticates, validates, uploads with the service-role client, and writes the public URL to `User.image`. A shared `Avatar` component renders `<img>` or the initial-circle at the two existing avatar sites; `User.image` already flows through the queries, so no query changes.

**Tech Stack:** Next.js 16 App Router (Route Handler, `runtime = "nodejs"`), Supabase Storage (`@supabase/supabase-js` service-role client), Prisma 7, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-07-06-guide-profile-photo-design.md`

## Global Constraints

- **Images:** accept `image/jpeg`, `image/png`, `image/webp` only; max **5 MB**. Server is the authority; any client-side check is UX only.
- **Rendering:** plain `<img>` (no `next/image`) — consistent with the whole codebase.
- **Storage writes:** only via the server route using the **service-role key** (`SUPABASE_SECRET_KEY`). Never from client code. No client-side Storage policies.
- **Object path:** deterministic `${userId}/avatar.<ext>` — one object per guide, `upsert: true`.
- **Per task:** commit after the task's verification passes; stage ONLY that task's files; NEVER stage the unrelated architecture-doc moves in the working tree; do NOT push (controller pushes at the end).

## File Structure

- `src/lib/supabase/admin.ts` (new) — service-role client factory `createAdminClient()`.
- `scripts/setup-storage.ts` (new) — idempotent `avatars` bucket creation; `npm run setup:storage`.
- `src/app/api/guides/photo/route.ts` (new) — `POST` (upload) + `DELETE` (remove).
- `tests/guide-photo.test.ts` (new) — route unit tests.
- `src/components/Avatar.tsx` (new) — presentational avatar (img or initial-circle), fills its parent.
- `src/components/ProfilePhotoCard.tsx` (new) — dashboard upload UI (client).
- Modified: `src/app/guides/[id]/page.tsx`, `src/components/SearchableGuides.tsx` (swap in `Avatar`), `src/app/account/page.tsx` (render `ProfilePhotoCard`), `package.json` (script), `README.md` (deploy line).

---

### Task 1: Service-role client + bucket provisioning

**Files:**
- Create: `src/lib/supabase/admin.ts`
- Create: `scripts/setup-storage.ts`
- Modify: `package.json` (add `setup:storage` script)

**Interfaces:**
- Produces: `createAdminClient()` → a `SupabaseClient` built with the service-role key (used by Task 2's route).

- [ ] **Step 1: Create the admin client factory**

`src/lib/supabase/admin.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client for SERVER-ONLY use (uploads, admin ops).
// Bypasses RLS and Storage policies — never import this into client code.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

- [ ] **Step 2: Create the idempotent setup script**

`scripts/setup-storage.ts`:

```ts
import "dotenv/config";
import { createAdminClient } from "../src/lib/supabase/admin";

const BUCKET = "avatars";

async function main() {
  const admin = createAdminClient();
  const { data: buckets, error: listErr } = await admin.storage.listBuckets();
  if (listErr) throw listErr;

  if (buckets.some((b) => b.name === BUCKET)) {
    console.log(`Bucket "${BUCKET}" already exists — nothing to do.`);
    return;
  }

  const { error } = await admin.storage.createBucket(BUCKET, { public: true });
  if (error) throw error;
  console.log(`Created public bucket "${BUCKET}".`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 3: Add the npm script**

In `package.json`, add to `scripts` (after `"migrate:deploy"`):

```json
    "setup:storage": "tsx scripts/setup-storage.ts"
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "supabase/admin|setup-storage" || echo clean`
Expected: `clean`

- [ ] **Step 5: Run it against the live project (idempotent)**

Load env and run the script (the same env-loading pattern used elsewhere):

Run: `set -a && . ./.env && set +a && npm run setup:storage`
Expected: prints `Created public bucket "avatars".` on first run. Run it a **second** time → expected `Bucket "avatars" already exists — nothing to do.` (proves idempotency).

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/admin.ts scripts/setup-storage.ts package.json
git commit -m "feat: avatars storage bucket provisioning + service-role client"
```

---

### Task 2: Upload/remove route + tests (TDD)

**Files:**
- Create: `tests/guide-photo.test.ts`
- Create: `src/app/api/guides/photo/route.ts`

**Interfaces:**
- Consumes: `createAdminClient()` (Task 1); `getUser()` from `@/lib/auth` (returns `{ id, email, name, role, image } | null`); `prisma.guide.findUnique`, `prisma.user.update`.
- Produces: `POST` returns `{ url }` (200) and sets `User.image`; `DELETE` returns `{ ok: true }` and clears `User.image`. Consumed by Task 4's `ProfilePhotoCard`.

- [ ] **Step 1: Write the failing tests**

`tests/guide-photo.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUpload = vi.fn()
const mockRemove = vi.fn()
const mockGetPublicUrl = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    guide: { findUnique: vi.fn() },
    user: { update: vi.fn() },
  },
}))
vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    storage: {
      from: () => ({ upload: mockUpload, remove: mockRemove, getPublicUrl: mockGetPublicUrl }),
    },
  }),
}))

import { POST, DELETE } from '@/app/api/guides/photo/route'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

const mockedGetUser = vi.mocked(getUser)
const mockedFindGuide = vi.mocked(prisma.guide.findUnique)
const mockedUpdateUser = vi.mocked(prisma.user.update)

function fileOf(type: string, bytes = 1024) {
  return new File([new Uint8Array(bytes)], 'a', { type })
}
function postWith(file?: File) {
  const fd = new FormData()
  if (file) fd.set('file', file)
  return new Request('http://localhost/api/guides/photo', { method: 'POST', body: fd })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetUser.mockResolvedValue({ id: 'user_1' } as never)
  mockedFindGuide.mockResolvedValue({ id: 'guide_1', userId: 'user_1' } as never)
  mockedUpdateUser.mockResolvedValue({} as never)
  mockUpload.mockResolvedValue({ error: null })
  mockRemove.mockResolvedValue({ error: null })
  mockGetPublicUrl.mockReturnValue({
    data: { publicUrl: 'https://x.supabase.co/storage/v1/object/public/avatars/user_1/avatar.png' },
  })
})

describe('POST /api/guides/photo', () => {
  it('returns 401 when not logged in', async () => {
    mockedGetUser.mockResolvedValue(null as never)
    const res = await POST(postWith(fileOf('image/png')) as never)
    expect(res.status).toBe(401)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('returns 403 when the user is not a guide', async () => {
    mockedFindGuide.mockResolvedValue(null as never)
    const res = await POST(postWith(fileOf('image/png')) as never)
    expect(res.status).toBe(403)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('returns 400 when no file is provided', async () => {
    const res = await POST(postWith() as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 for an unsupported image type', async () => {
    const res = await POST(postWith(fileOf('image/gif')) as never)
    expect(res.status).toBe(400)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('returns 413 for a file over 5 MB', async () => {
    const res = await POST(postWith(fileOf('image/png', 6 * 1024 * 1024)) as never)
    expect(res.status).toBe(413)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('uploads to the deterministic path and stores the public URL', async () => {
    const res = await POST(postWith(fileOf('image/png')) as never)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.url).toContain('avatars/user_1/avatar.png')

    expect(mockUpload).toHaveBeenCalledWith(
      'user_1/avatar.png',
      expect.anything(),
      expect.objectContaining({ contentType: 'image/png', upsert: true })
    )
    const updateArg = mockedUpdateUser.mock.calls[0][0]
    expect(updateArg.where).toEqual({ id: 'user_1' })
    expect((updateArg.data as { image: string }).image).toContain('avatar.png')
  })

  it('returns 500 when the storage upload fails', async () => {
    mockUpload.mockResolvedValue({ error: { message: 'boom' } })
    const res = await POST(postWith(fileOf('image/png')) as never)
    expect(res.status).toBe(500)
    expect(mockedUpdateUser).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/guides/photo', () => {
  it('returns 401 when not logged in', async () => {
    mockedGetUser.mockResolvedValue(null as never)
    const res = await DELETE()
    expect(res.status).toBe(401)
  })

  it('clears User.image and removes the objects', async () => {
    const res = await DELETE()
    expect(res.status).toBe(200)
    expect(mockRemove).toHaveBeenCalled()
    expect(mockedUpdateUser).toHaveBeenCalledWith({ where: { id: 'user_1' }, data: { image: null } })
  })
})
```

- [ ] **Step 2: Run — expect failure** (module not found): `npx vitest run tests/guide-photo.test.ts`

- [ ] **Step 3: Implement the route**

`src/app/api/guides/photo/route.ts`:

```ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "avatars";
const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function avatarPaths(userId: string) {
  return Object.values(EXT).map((e) => `${userId}/avatar.${e}`);
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
    return NextResponse.json({ error: "Image too large (max 5 MB)" }, { status: 413 });
  }

  const admin = createAdminClient();
  const path = `${user.id}/avatar.${ext}`;

  // Drop other-extension variants so a guide keeps at most one avatar object.
  const stale = avatarPaths(user.id).filter((p) => p !== path);
  await admin.storage.from(BUCKET).remove(stale);

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (uploadErr) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  // Deterministic path → cache-bust so a replaced photo isn't served stale.
  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  const url = `${pub.publicUrl}?v=${Date.now()}`;

  await prisma.user.update({ where: { id: user.id }, data: { image: url } });

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
  await admin.storage.from(BUCKET).remove(avatarPaths(user.id));

  await prisma.user.update({ where: { id: user.id }, data: { image: null } });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run — expect all pass**, then full suite: `npx vitest run`
Expected: `tests/guide-photo.test.ts` 9/9 pass; full suite green (59 prior + 9 = 68).

- [ ] **Step 5: Commit**

```bash
git add tests/guide-photo.test.ts src/app/api/guides/photo/route.ts
git commit -m "feat: guide profile photo upload/remove route"
```

---

### Task 3: Avatar component + swap into the two display sites

**Files:**
- Create: `src/components/Avatar.tsx`
- Modify: `src/app/guides/[id]/page.tsx` (line 57–59 region)
- Modify: `src/components/SearchableGuides.tsx` (line 242–246 region)

**Interfaces:**
- Produces: `<Avatar image={string|null} name={string|null} fontSize={number} />` — fills its parent (100% × 100%); parent controls size/shape/border.

- [ ] **Step 1: Create the Avatar component**

`src/components/Avatar.tsx`:

```tsx
import React from "react";

// Fills its parent (100% × 100%). The parent controls size, border-radius,
// border and overflow — Avatar only decides photo-vs-initials.
export default function Avatar({
  image,
  name,
  fontSize,
}: {
  image: string | null;
  name: string | null;
  fontSize: number;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={name ?? "Guide"}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    );
  }
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "var(--brand-coral)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize,
      }}
    >
      {name ? name.substring(0, 1).toUpperCase() : "SG"}
    </div>
  );
}
```

- [ ] **Step 2: Swap into the guide profile page**

In `src/app/guides/[id]/page.tsx`, add the import after the existing `import NavActions ...` line:

```tsx
import Avatar from '@/components/Avatar';
```

Replace the avatar `<div>` (currently lines 57–59):

```tsx
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--brand-coral)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 800, border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {guide.user.name ? guide.user.name.substring(0, 1).toUpperCase() : 'SG'}
                </div>
```

with:

```tsx
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0 }}>
                  <Avatar image={guide.user.image} name={guide.user.name} fontSize={36} />
                </div>
```

- [ ] **Step 3: Swap into the search card**

In `src/components/SearchableGuides.tsx`, add after the `import Link from 'next/link';` line:

```tsx
import Avatar from '@/components/Avatar';
```

Replace the inner avatar `<div>` (currently lines 243–245):

```tsx
                        <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--brand-coral)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '20px' }}>
                          {guide.user.name ? guide.user.name.substring(0, 1).toUpperCase() : 'SG'}
                        </div>
```

with:

```tsx
                        <Avatar image={guide.user.image} name={guide.user.name} fontSize={20} />
```

(The `.wl-card-avatar-container` parent already sets `border-radius: 50%` + `overflow: hidden`, so the `<img>` clips to a circle.)

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit 2>&1 | grep -E "Avatar|guides/|SearchableGuides" || echo clean`
Expected: `clean`
Run: `npm run build 2>&1 | tail -3`
Expected: succeeds.

- [ ] **Step 5: Run tests** (no behavior change to existing tests): `npx vitest run`
Expected: full suite green (68).

- [ ] **Step 6: Commit**

```bash
git add src/components/Avatar.tsx "src/app/guides/[id]/page.tsx" src/components/SearchableGuides.tsx
git commit -m "feat: shared Avatar component renders photo or initial-circle"
```

---

### Task 4: Dashboard upload UI

**Files:**
- Create: `src/components/ProfilePhotoCard.tsx`
- Modify: `src/app/account/page.tsx`

**Interfaces:**
- Consumes: `POST`/`DELETE /api/guides/photo` (Task 2); `<Avatar>` (Task 3). `getUser()` on the account page already returns `{ id, email, name, role, image }`.

- [ ] **Step 1: Create the ProfilePhotoCard**

`src/components/ProfilePhotoCard.tsx`:

```tsx
'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 5 * 1024 * 1024;

export default function ProfilePhotoCard({
  currentImage,
  name,
}: {
  currentImage: string | null;
  name: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      setError('Please choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setError('Image too large (max 5 MB).');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onSave = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.set('file', file);
      const res = await fetch('/api/guides/photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed');
        setLoading(false);
        return;
      }
      setFile(null);
      setPreview(null);
      router.refresh();
    } catch {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  const onRemove = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/guides/photo', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Could not remove photo');
        setLoading(false);
        return;
      }
      setFile(null);
      setPreview(null);
      router.refresh();
    } catch {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  const shownImage = preview ?? currentImage;

  return (
    <section style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '32px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0' }}>Profile photo</h2>
      <p style={{ fontSize: '14px', color: 'var(--neutral-gray)', margin: '0 0 24px 0' }}>
        A clear photo of yourself helps travelers trust and choose you. JPEG, PNG, or WebP, up to 5&nbsp;MB.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ width: '96px', height: '96px', borderRadius: '50%', overflow: 'hidden', border: '3px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', flexShrink: 0 }}>
          <Avatar image={shownImage} name={name} fontSize={34} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input ref={inputRef} type="file" accept={ACCEPT} onChange={onPick} style={{ display: 'none' }} />
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={loading} style={{ border: '1px solid rgba(0,0,0,0.12)', background: 'white', borderRadius: '999px', padding: '8px 18px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              Choose photo
            </button>
            {file && (
              <button type="button" onClick={onSave} disabled={loading} className="btn btn-primary" style={{ borderRadius: '999px', padding: '8px 20px', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Saving…' : 'Save'}
              </button>
            )}
            {currentImage && !file && (
              <button type="button" onClick={onRemove} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--neutral-gray)', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Removing…' : 'Remove'}
              </button>
            )}
          </div>
          {error && <div style={{ color: '#DC2626', fontSize: '13px' }}>{error}</div>}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Render it on the dashboard**

In `src/app/account/page.tsx`, add the import after the `import AvailabilityManager ...` line:

```tsx
import ProfilePhotoCard from '@/components/ProfilePhotoCard';
```

Then insert the card immediately after the header block — i.e. after the `</div>` that closes the `display: flex ... justify-content: space-between` header (the block containing the `<h1>Guide dashboard</h1>` and the "View your public profile →" link, currently ending at line 93), and before the `{/* Availability ... */}` comment:

```tsx
      <ProfilePhotoCard currentImage={user.image} name={user.name} />
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit 2>&1 | grep -E "ProfilePhotoCard|account/page" || echo clean`
Expected: `clean`
Run: `npm run build 2>&1 | tail -3`
Expected: succeeds.

- [ ] **Step 4: Run tests**: `npx vitest run`
Expected: full suite green (68).

- [ ] **Step 5: Commit**

```bash
git add src/components/ProfilePhotoCard.tsx src/app/account/page.tsx
git commit -m "feat: profile photo upload card on the guide dashboard"
```

---

### Task 5: README deploy line + live E2E + push (controller-run)

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document the bucket step**

In `README.md`, in the "Deployment (minimal path)" section, add a step after the migrations step (before "Deploy"):

> Run `npm run setup:storage` once per environment to create the public `avatars` Storage bucket (idempotent; safe to re-run).

Also add it to the local "Getting started" sequence after `npx prisma db seed`:

```bash
npm run setup:storage   # one-time: create the public avatars Storage bucket
```

Commit:
```bash
git add README.md
git commit -m "docs: document setup:storage step"
```

- [ ] **Step 2: Live E2E** (script, against real Supabase — the bucket already exists from Task 1 Step 5):
  - Create a fresh auth user via admin API; give them a `Guide` row (or reuse a seeded guide's session).
  - Obtain their session, POST a small PNG fixture as `FormData` to `http://localhost:3000/api/guides/photo`.
  - Assert 200 + `{ url }`; assert `User.image` is populated in the DB; assert the object exists in the `avatars` bucket and the public URL returns 200.
  - GET `/guides/<id>` and the search API `/api/guides` → assert the URL appears.
  - `DELETE /api/guides/photo` with that session → assert `User.image` null and the object is gone.
  - Clean up the test user.

- [ ] **Step 3: Smoke** `/account` (as a guide) shows the "Profile photo" card; `/`, `/guides/[id]` still render.

- [ ] **Step 4: Final whole-feature review (subagent), fixes if any, then push to main.**

## Self-Review

- **Spec coverage:** bucket (§1)→T1; admin client (§2)→T1; route POST/DELETE (§3)→T2; ProfilePhotoCard (§4)→T4; Avatar + display swap (§5)→T3; verification (§Testing)→T2 unit + T5 E2E. ✅
- **Placeholder scan:** none — every step has concrete code/commands. ✅
- **Type consistency:** `createAdminClient()` defined T1, consumed T2; `<Avatar image name fontSize />` defined T3, consumed T3 & T4; `getUser()` returns `image` (verified in `src/lib/auth.ts`), consumed on the account page T4; route returns `{ url }` / `{ ok: true }`, consumed by `ProfilePhotoCard` T4. ✅
- **Anchors:** exact line regions cited match the current files (guides/[id] 57–59, SearchableGuides 243–245, account header ends 93). ✅
