# Supabase Auth + Postgres Migration — Phase 1 Design

**Date:** 2026-07-04
**Status:** Approved (design), awaiting spec review
**Scope:** Phase 1 of 4. This spec covers the auth migration and Postgres hosting only. Storage phases (profile photos, guide gallery, verification docs) are deferred to their own specs.

## Context

The app currently uses **NextAuth v5 (beta) with a Credentials provider** and the `@auth/prisma-adapter`, storing sessions and accounts in Postgres via Prisma. Passwords are bcrypt-hashed in `User.hashedPassword`. We are migrating authentication to **Supabase Auth**, hosting Postgres on **Supabase**, and (in later phases) using **Supabase Storage**.

**Decisions locked during brainstorming:**

- **Clean slate.** Pre-launch; no production users or bookings to preserve. We reset migrations and redesign the `User` table around Supabase Auth UUIDs.
- **Supabase = Auth + Storage + Postgres hosting.** Not the data API.
- **Prisma stays the data layer.** All queries, the slot-locking booking transaction, and the Stripe webhook remain Prisma server-side, with authorization enforced in app code (no client-side RLS policies).
- **Profile creation via Postgres trigger (Option A).** A DB trigger on `auth.users` guarantees a matching `User` row always exists, regardless of signup path.

## Decomposition (full project, for context)

1. **Phase 1 — Supabase foundation + auth migration** *(this spec)*
2. Phase 2 — Guide profile photos (Storage)
3. Phase 3 — Guide gallery / tour photos (Storage, new model)
4. Phase 4 — Verification documents (private bucket, signed URLs, admin review)

Each later phase gets its own spec → plan → implementation cycle. Phase 1 sketches the Storage architecture (below) only enough to avoid painting later phases into a corner.

## Architecture

### Auth flow after migration

- A user signs up/logs in through the **Supabase Auth** system (managed `auth.users` table). Credentials (email + password) are verified by Supabase, not our code.
- Our Prisma **`User` table becomes a profile table** keyed by the same UUID as `auth.users.id`. It holds app-domain fields (`role`, `name`, `stripeCustomerId`, `image`) but **not** the password.
- A **Postgres trigger** (`after insert on auth.users`) inserts the `User` profile row automatically.
- Server code reads the session via `@supabase/ssr`, then loads the `User` profile (and fresh `role`) via Prisma.

### Storage sketch (phases 2–4, not built now)

Three buckets, uploads via server routes using the Supabase **secret key**, authorization in app code (consistent with the rest of the app; no RLS to maintain):

- `avatars` — public — guide profile photos (Phase 2)
- `gallery` — public — guide tour photos (Phase 3)
- `verification-docs` — **private**, signed URLs — ID / student cards for admin review (Phase 4)

## Components

### 1. Supabase project configuration (manual, dashboard)

- **Auth → Email**: disable "Confirm email" for now (no SMTP configured). Re-enable when email is set up.
- **Connect → Session pooler**: connection string (port 5432, IPv4-safe for Docker/VPS deploy) → `DATABASE_URL`.
- **Settings → API keys**: publishable key (already have) + **secret key** (`sb_secret_...`) for seeding and Storage.

### 2. Schema & migrations (clean-slate reset)

- **Drop** models `Account`, `Session`, `VerificationToken`.
- **`User` becomes a profile table**: `id String @id` now holds the Supabase Auth UUID (remove `@default(cuid())`). Drop `hashedPassword` and `emailVerified`. Keep `name`, `email`, `image`, `role`, `stripeCustomerId`, `createdAt`, `updatedAt`, and the `guideProfile` / `bookings` relations.
- `Guide`, `AvailabilitySlot`, `Booking` unchanged.
- **No Prisma-modeled FK to `auth.users`** (cross-schema; Prisma can't model it and would report drift). The trigger is the consistency mechanism.
- **Trigger migration**: hand-written SQL migration creates `handle_new_user()` + an `after insert on auth.users` trigger inserting the `User` row (`id`, `email`, `name` from `raw_user_meta_data`, `role` default `TOURIST`). Guarded so it no-ops on a plain Postgres without an `auth` schema (the docker-compose dev DB), keeping the migration set applicable everywhere.
- **Migrations reset**: delete `prisma/migrations/*`; generate one fresh init migration + the trigger migration. Going forward: author migrations against local Docker Postgres (`migrate dev`), apply to Supabase with `npm run migrate:deploy` (avoids Supabase shadow-DB issues).

### 3. Auth plumbing (new / rewritten files)

- `src/lib/supabase/server.ts` — `createServerClient` bound to Next 16 async `cookies()`.
- `src/lib/supabase/client.ts` — `createBrowserClient`.
- `src/proxy.ts` — **Next 16 renamed Middleware to Proxy** (verified in `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`). Same Supabase token-refresh logic, exported as `proxy`, with a matcher excluding static assets.
- `src/lib/auth.ts` — **rewritten in place** (tests mock this module path). Exports `getUser()`: `supabase.auth.getUser()` → if authenticated, Prisma lookup of the `User` row → returns the profile (`{ id, email, name, role, ... }`) or `null`. Role always fresh from the DB — eliminates the JWT role-staleness workaround (`update()` in `/apply`).

### 4. Call-site changes

| File | Change |
|---|---|
| `account/page.tsx`, `bookings/page.tsx`; `api/availability/route.ts`, `api/checkout/route.ts`, `api/guides/apply/route.ts` | `await auth()` → `await getUser()`; null → redirect / 401 (same response shape as today) |
| `login/page.tsx` | `signIn('credentials')` → browser client `signInWithPassword()`; register form → `signUp({ email, password, options: { data: { name } } })`, then `router.refresh()` |
| `api/auth/register/route.ts`, `api/auth/[...nextauth]/route.ts` | **deleted** (trigger + client `signUp` replace them) |
| `NavActions.tsx` | split into a server component (fetches `getUser()`, renders links) + a tiny client child for Log out (`supabase.auth.signOut()` + `router.refresh()`). Removes the loading flicker. The 4 pages that render it keep their JSX |
| `apply/page.tsx` | drop `useSession` / `update()`; gate via server check, `router.refresh()` after success |
| `BookingWidget.tsx` | drop `useSession`; receive `isLoggedIn` prop from the `guides/[id]` server page |
| `Providers.tsx` | **deleted**; `layout.tsx` renders children directly (no `SessionProvider`) |
| `checkout/route.ts` | `NEXTAUTH_URL` → `APP_URL` (used only to build Stripe redirect URLs) |

### 5. Seed & tests

- **Seed** (`prisma/seed.ts`): demo guides must be able to log in, so create them via the Supabase **admin API** (`auth.admin.createUser` with `email_confirm: true` + a password) — the trigger creates the `User` row — then set role to `GUIDE` and upsert the guide profile as today. Requires `SUPABASE_SECRET_KEY`.
- **Tests**: files mocking `@/lib/auth`'s `auth()` switch to mocking `getUser()` returning `{ id: 'user_1', role: ... }` or `null`. Assertion logic unchanged.

### 6. Env & dependencies

- **Add**: `@supabase/supabase-js`, `@supabase/ssr`.
- **Remove**: `next-auth`, `@auth/prisma-adapter`, `bcryptjs`, `@types/bcryptjs`.
- **`.env.example`**: `DATABASE_URL` (Supabase session pooler), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `APP_URL`. **Drop** `AUTH_SECRET`, `NEXTAUTH_URL`. Stripe vars unchanged.

## Error handling

- `getUser()` returns `null` on no/invalid session; every call site already branches on the falsy case (redirect for pages, 401 for routes) — preserve those exact responses.
- Trigger runs inside the auth insert transaction; if the `User` insert fails, the signup fails atomically (no orphaned auth user).
- Register UI surfaces Supabase `signUp` errors (e.g. duplicate email) the way the current form surfaces the 409.

## Testing / Verification criteria

1. `npm test` green after mock updates.
2. Fresh migrations apply to Supabase via `npm run migrate:deploy`; trigger visible in the dashboard.
3. End-to-end against Supabase: sign up → `User` row appears with `TOURIST` role → log in / out → nav reflects state → `/apply` flips role to `GUIDE` and nav shows the dashboard link **without re-login** → booking checkout still reaches Stripe.
4. Seeded guides visible on the homepage and bookable.

## Out of scope (Phase 1)

- Any Storage upload feature (phases 2–4).
- OAuth / social login.
- Email confirmation & password reset flows (deferred until SMTP is configured).
- Migrating existing users (none exist — clean slate).
