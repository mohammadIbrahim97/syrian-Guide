# Guide Profile Photo — Design (issue #25)

**Date:** 2026-07-06
**Status:** Approved
**Scope:** Phase 2 of the Supabase Storage roadmap. Let a guide upload/replace/remove a profile photo, shown on their public profile and on the guide cards. Establishes the Storage upload plumbing that #26 (tour gallery) reuses.

## Context

Guides are represented only by an initial-in-a-circle today (`src/app/guides/[id]/page.tsx:57` and `src/components/SearchableGuides.tsx:244`). `User.image String?` exists in the schema and is unused. This is a marketplace where tourists book strangers for private in-person tours, so a real face is a strong trust signal.

**Decisions locked during brainstorming:**
- **Upload location:** dashboard only (`/account`). The `/apply` form stays unchanged.
- **Image handling:** no server-side processing. Store the file as uploaded; render square/circle via CSS `object-fit: cover`. Accept jpeg/png/webp, max 5 MB.
- **Rendering:** plain `<img>` (consistent with every image in the app today). No `next/image`.
- **Upload path (Option A):** browser sends `FormData` to our server route, which authenticates, validates, uploads with the service-role key, updates `User.image`, returns the URL. Server-authoritative, matching every other write in the app.

## Components

### 1. Storage bucket
Create a **public** Supabase Storage bucket `avatars`. Public read; all writes go through the server route using the service-role key (no client-side Storage policies). Object path is **deterministic per guide**: `${userId}/avatar.<ext>` where `<ext>` derives from the uploaded MIME type. Re-uploading overwrites (`upsert: true`) — no orphan accumulation.

Bucket creation is a **standalone idempotent script** `scripts/setup-storage.ts` (guarded `createBucket("avatars", { public: true })` that ignores "already exists"), exposed as `npm run setup:storage`. It is **not** folded into `prisma/seed.ts` — the README treats seeding as optional demo data, whereas the bucket is required infrastructure. The deploy story (README) gains one line: run `setup:storage` once per environment, alongside `migrate:deploy`. Run once now against the live project during implementation. (If the bucket is missing at upload time, the route surfaces a clear 500 so it's diagnosable.)

### 2. Server-side admin client — `src/lib/supabase/admin.ts` (new)
A small module exporting a service-role client built from `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY` (the inline pattern currently duplicated in `prisma/seed.ts`), for server routes that need to bypass RLS/Storage policies:
```ts
import { createClient } from "@supabase/supabase-js";
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```
(Seed may later switch to this; not required by this issue.)

### 3. Route — `src/app/api/guides/photo/route.ts` (new)
- **`POST`** (`export const runtime = "nodejs"`; multipart):
  1. `getUser()` → 401 if null.
  2. `prisma.guide.findUnique({ where: { userId: user.id } })` → 403 "You are not a guide" if none. (Only guides have a public profile to show a photo on.)
  3. `await request.formData()`; read `file`. Missing/not a File → 400.
  4. Validate `file.type ∈ {image/jpeg, image/png, image/webp}` → 400 "Unsupported image type"; `file.size ≤ 5 MB` → 413 "Image too large (max 5 MB)".
  5. `ext` from type (`jpeg→jpg`, `png`, `webp`); `path = ${user.id}/avatar.${ext}`.
  6. Upload via admin client: `storage.from("avatars").upload(path, buffer, { contentType: file.type, upsert: true })`. On error → 500.
  7. `getPublicUrl(path)`; append a cache-buster (`?v=${Date.now()}`) so a replaced photo isn't served stale from the deterministic URL.
  8. `prisma.user.update({ where: { id: user.id }, data: { image: publicUrl } })`.
  9. Return `{ url }`, 200.

  **Stale-path cleanup:** because `ext` is part of the path, switching formats (png→jpg) would leave the old object. Before upload, best-effort `remove` of the other-extension variants for this user (`avatar.jpg/png/webp` except the new one). Keeps at most one object per guide.

- **`DELETE`**: auth + guide check as above; remove all `avatar.*` variants for the user from the bucket (best-effort); `prisma.user.update` set `image: null`; return `{ ok: true }`. Reverts to the initial-circle.

### 4. UI — `src/components/ProfilePhotoCard.tsx` (new, client)
A card rendered at the **top of `/account`** (`src/app/account/page.tsx`, above "Your availability"). Props: `{ currentImage: string | null, name: string | null }` (passed from the server page, which already loads the guide + user). Behavior:
- Shows current photo (or the initial-circle) at ~100px.
- File input (`accept="image/jpeg,image/png,image/webp"`); on select, show a client-side **preview** (`URL.createObjectURL`) and client-side guard on type/size (mirrors server; server remains the authority).
- **Save** → `POST` the FormData → on success `router.refresh()` (server re-renders with the new `User.image` everywhere). **Remove** → `DELETE` → `router.refresh()`. Inline error text on failure; disabled/loading states.

### 5. Display — `src/components/Avatar.tsx` (new)
A tiny presentational component: `{ image: string | null, name: string | null, size: number, fontSize?: number }`. Renders `<img src={image} style={{ width, height, borderRadius: '50%', objectFit: 'cover', ... }}>` when `image` is set, else the existing initial-circle (`name?.[0]?.toUpperCase() ?? 'SG'`). Swapped into:
- `src/app/guides/[id]/page.tsx:57` (100px circle, the coral border/shadow stays on the wrapper),
- `src/components/SearchableGuides.tsx:244` (inside `wl-card-avatar-container`, fills the container).

`User.image` already flows through `publicGuideSelect` (`src/lib/public-guide.ts`) → the profile page and the card/search API already have the field. **No query changes.**

## Data flow

Upload: dashboard `ProfilePhotoCard` → `POST /api/guides/photo` (auth → validate → Storage upsert → `User.image = publicUrl`) → `router.refresh()` → server components re-read `User.image` → `Avatar` shows the photo on `/account`, the public profile, and the cards.

## Error handling
- Anonymous → 401; non-guide → 403; missing file → 400; wrong type → 400; >5 MB → 413; Storage failure → 500. All surfaced as inline text in the card.
- The client-side preview/validation is UX only; the server route is the authority.
- Cache-buster query param prevents a replaced avatar from being served stale from its deterministic public URL.

## Testing / Verification
1. **Unit** (`tests/guide-photo.test.ts`, mock `@/lib/auth`, `@/lib/prisma`, `@/lib/supabase/admin`): 401 anon, 403 non-guide, 400 no file, 400 bad type, 413 oversized, 200 happy path (asserts `storage.upload` called with the `${userId}/avatar.*` path + `user.update` sets `image`), DELETE clears `image`.
2. **Build + full suite** green.
3. **Live E2E** (script, against real Supabase): create a guide session → POST a small fixture image → assert `User.image` populated + object exists in `avatars` + public URL 200s; GET the guide profile and the search API and assert the URL is present; DELETE → `User.image` null + object gone. Fresh test user, cleaned up.

## Out of scope
Tour gallery (#26 — reuses this bucket plumbing), server-side resizing, `next/image` migration, avatars for non-guide tourists, cropping UI.
