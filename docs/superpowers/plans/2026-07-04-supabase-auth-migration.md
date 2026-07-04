# Supabase Auth + Postgres Migration — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace NextAuth v5 with Supabase Auth, host Postgres on Supabase, and keep Prisma as the data layer — pre-launch clean-slate migration.

**Architecture:** Supabase Auth owns `auth.users`; a Postgres trigger mirrors each new auth user into the Prisma `User` profile table (keyed by the same UUID). Server code reads the session via `@supabase/ssr` and loads the profile/role via Prisma. All queries, the slot-locking booking transaction, and the Stripe webhook stay on Prisma.

**Tech Stack:** Next.js 16 (App Router, `proxy.ts` — formerly middleware), Prisma 7 + `@prisma/adapter-pg`, `@supabase/supabase-js`, `@supabase/ssr`, Vitest, Stripe.

**Reference spec:** `docs/superpowers/specs/2026-07-04-supabase-auth-migration-design.md`

## Prerequisites (manual, before Task 4)

You need a Supabase project. In its dashboard:
- **Authentication → Sign In / Providers → Email**: turn **off** "Confirm email" (no SMTP yet; otherwise sign-ups get no session).
- **Connect → Session pooler**: copy the URI (port 5432) → this is `DATABASE_URL` for production/app-dev.
- **Settings → API keys**: copy the **publishable** key (`sb_publishable_...`) and the **secret** key (`sb_secret_...`).

Local Postgres (Docker) is used only to author migrations. `DATABASE_URL` points at **local Docker** while authoring (Tasks 4–5), and at **Supabase** when running the app/seed (Tasks 16–17).

## File Structure

**New files**
- `src/lib/supabase/server.ts` — server-side Supabase client bound to Next 16 async `cookies()`.
- `src/lib/supabase/client.ts` — browser Supabase client.
- `src/proxy.ts` — Next 16 Proxy; refreshes the Supabase session cookie on each request.
- `src/components/LogoutButton.tsx` — tiny client component for sign-out.
- `prisma/migrations/<ts>_init/migration.sql` — regenerated schema.
- `prisma/migrations/<ts>_auth_user_trigger/migration.sql` — hand-written trigger.

**Rewritten**
- `src/lib/auth.ts` — exports `getUser()` (was NextAuth `handlers/auth/signIn/signOut`).
- `src/components/NavActions.tsx` — async server component (was `use client` + `useSession`).
- `prisma/seed.ts` — creates demo guides via Supabase admin API.
- `src/app/login/page.tsx`, `src/app/apply/page.tsx`, `src/components/BookingWidget.tsx`, `src/app/layout.tsx`, `.env.example`.

**Edited (auth call sites)**
- `src/app/account/page.tsx`, `src/app/bookings/page.tsx`, `src/app/guides/[id]/page.tsx`, `src/app/api/checkout/route.ts`, `src/app/api/availability/route.ts`, `src/app/api/guides/apply/route.ts`, and their tests.

**Deleted**
- `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/auth/register/route.ts`, `src/components/Providers.tsx`.

---

### Task 1: Add Supabase dependencies

**Files:**
- Modify: `package.json`, `package-lock.json`

> Removal of `next-auth` / `bcryptjs` is deferred to Task 17 so every intermediate commit still installs and builds.

- [ ] **Step 1: Install the two Supabase packages**

Run: `npm install @supabase/supabase-js @supabase/ssr`
Expected: both added to `dependencies`; lockfile updated; no peer-dep errors.

- [ ] **Step 2: Verify they resolve**

Run: `node -e "require('@supabase/ssr'); require('@supabase/supabase-js'); console.log('ok')"`
Expected: prints `ok`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @supabase/supabase-js and @supabase/ssr"
```

---

### Task 2: Update env template and docker-compose

**Files:**
- Modify: `.env.example` (full rewrite)
- Modify: `docker-compose.yml` (remove dead `NEXTAUTH_SECRET`)

- [ ] **Step 1: Replace `.env.example` with the Supabase variable set**

Overwrite `.env.example` with exactly:

```bash
# Copy to .env and fill in real values.

# Postgres connection string.
# For the app / production: Supabase → Connect → Session pooler (port 5432).
# For authoring migrations locally: the Docker Postgres from docker-compose.yml.
# NOTE: must be set BEFORE `npm install` — the postinstall `prisma generate`
# loads prisma.config.ts, which throws if DATABASE_URL is missing.
DATABASE_URL="postgresql://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:5432/postgres"

# Supabase project URL and publishable (anon) key — Settings → API.
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."

# Supabase secret key (server-only). Used by prisma/seed.ts to create demo
# auth users, and later by Storage upload routes. Never expose to the client.
SUPABASE_SECRET_KEY="sb_secret_..."

# Public base URL of the app. Used to build the Stripe Checkout
# success/cancel redirect URLs.
APP_URL="http://localhost:3000"

# Stripe API keys (use test-mode keys locally): https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY="sk_test_..."

# Signing secret of the Stripe webhook endpoint pointed at /api/webhook.
# REQUIRED: the webhook refuses to process events without it.
# Local dev: `stripe listen --forward-to localhost:3000/api/webhook` prints one.
STRIPE_WEBHOOK_SECRET="whsec_..."
```

- [ ] **Step 2: Remove the dead `NEXTAUTH_SECRET` from docker-compose**

In `docker-compose.yml`, delete this line from the `web` service `environment:` list:

```yaml
      - NEXTAUTH_SECRET=dein_super_geheimnis_32_zeichen
```

(Leave `DATABASE_URL` and `NODE_ENV` — Prisma still uses the local DB for authoring migrations.)

- [ ] **Step 3: Verify no other code references removed vars**

Run: `grep -rn "AUTH_SECRET\|NEXTAUTH_SECRET\|NEXTAUTH_URL" src/ docker-compose.yml`
Expected: **no matches** (the `NEXTAUTH_URL` in `checkout/route.ts` is replaced in Task 9; if it still shows here that's expected until then — note it and continue).

- [ ] **Step 4: Commit**

```bash
git add .env.example docker-compose.yml
git commit -m "chore: swap NextAuth env vars for Supabase in templates"
```

---

### Task 3: Redesign the Prisma `User` model as a profile table

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Delete the NextAuth models**

Remove the entire `model Account { … }`, `model Session { … }`, and `model VerificationToken { … }` blocks (lines 17–55 in the current file).

- [ ] **Step 2: Replace the `User` model**

Replace the current `model User { … }` block with:

```prisma
model User {
  id               String   @id
  name             String?
  email            String   @unique
  image            String?
  role             Role     @default(TOURIST)
  stripeCustomerId String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  guideProfile Guide?
  bookings     Booking[]
}
```

Changes vs. before: `id` no longer has `@default(cuid())` (it holds the Supabase Auth UUID); `emailVerified` and `hashedPassword` removed; `accounts` and `sessions` relations removed. `Role` enum, `Guide`, `AvailabilitySlot`, `Booking` are unchanged.

- [ ] **Step 3: Validate and format**

Run: `npx prisma validate && npx prisma format`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 4: Regenerate the client**

Run: `npx prisma generate`
Expected: `Generated Prisma Client` — no errors about dangling relations.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: make User a Supabase-Auth-keyed profile table, drop NextAuth models"
```

---

### Task 4: Reset migrations and regenerate the init migration

**Files:**
- Delete: `prisma/migrations/*` (all existing migration folders)
- Create: `prisma/migrations/<ts>_init/migration.sql` (generated)

> Point `DATABASE_URL` at **local Docker Postgres** for this task. `migrate dev` needs a shadow DB (superuser can create one — Docker Postgres runs as `postgres`, so this works; Supabase's pooler does not, which is why we author locally).

- [ ] **Step 1: Start local Postgres**

Run: `docker compose up -d db`
Expected: the `db` container is healthy (`docker compose ps` shows `healthy`).

- [ ] **Step 2: Confirm `DATABASE_URL` targets local Docker**

Ensure `.env` has:
`DATABASE_URL="postgresql://postgres:syriaguide2026@localhost:5432/syriaguide?schema=public"`
Run: `npx prisma validate`
Expected: valid.

- [ ] **Step 3: Delete old migrations and wipe the dev schema**

```bash
rm -rf prisma/migrations
echo 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;' | npx prisma db execute --stdin --schema prisma/schema.prisma
```
Expected: the `db execute` command prints nothing and exits 0 (schema emptied, including `_prisma_migrations`).

- [ ] **Step 4: Generate a fresh init migration**

Run: `npx prisma migrate dev --name init`
Expected: creates `prisma/migrations/<timestamp>_init/migration.sql`, applies it, and prints `Your database is now in sync with your schema.` No drift prompt (schema was emptied in Step 3).

- [ ] **Step 5: Sanity-check the generated SQL has no NextAuth tables**

Run: `grep -c "CREATE TABLE" prisma/migrations/*_init/migration.sql; grep -i "Account\|Session\|VerificationToken" prisma/migrations/*_init/migration.sql || echo "none (good)"`
Expected: table count is 4 (`User`, `Guide`, `AvailabilitySlot`, `Booking`); the second grep prints `none (good)`.

- [ ] **Step 6: Commit**

```bash
git add prisma/migrations
git commit -m "feat: reset migrations with Supabase-ready schema"
```

---

### Task 5: Add the auth-user → profile trigger migration

**Files:**
- Create: `prisma/migrations/<ts>_auth_user_trigger/migration.sql`

- [ ] **Step 1: Scaffold an empty migration**

Run: `npx prisma migrate dev --create-only --name auth_user_trigger`
Expected: creates `prisma/migrations/<timestamp>_auth_user_trigger/migration.sql` (empty) without applying.

- [ ] **Step 2: Write the trigger SQL**

Put this exact content in the new `migration.sql`:

```sql
-- Mirror every Supabase auth user into the public."User" profile table.
-- Guarded so it is a no-op on a plain Postgres (local Docker) with no auth schema.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public."User" (id, email, name, role, "createdAt", "updatedAt")
  values (
    new.id::text,
    new.email,
    new.raw_user_meta_data ->> 'name',
    'TOURIST',
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$
begin
  if to_regclass('auth.users') is not null then
    execute 'drop trigger if exists on_auth_user_created on auth.users';
    execute 'create trigger on_auth_user_created after insert on auth.users '
         || 'for each row execute function public.handle_new_user()';
  end if;
end
$$;
```

Notes: `"createdAt"`/`"updatedAt"` are set explicitly because a raw INSERT bypasses Prisma's `@updatedAt` (the column has no DB default). `new.id::text` casts the auth UUID to the `String` id column. `'TOURIST'` resolves to the `Role` enum via the column's type.

- [ ] **Step 3: Apply it (no-op locally)**

Run: `npx prisma migrate dev`
Expected: applies `auth_user_trigger`; prints `Your database is now in sync`. Locally the `do $$ … $$` block finds no `auth.users` and creates only the function.

- [ ] **Step 4: Verify the function exists locally**

Run: `echo "select proname from pg_proc where proname = 'handle_new_user';" | npx prisma db execute --stdin --schema prisma/schema.prisma`
Expected: exits 0 (function present; the guarded trigger is intentionally absent locally).

- [ ] **Step 5: Commit**

```bash
git add prisma/migrations
git commit -m "feat: trigger to create a User profile on Supabase auth signup"
```

---

### Task 6: Supabase client helpers

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`

- [ ] **Step 1: Write the server client**

`src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore because the
            // proxy (src/proxy.ts) refreshes the session cookie on each request.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 2: Write the browser client**

`src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in the two new files. (Pre-existing errors elsewhere from in-progress migration are acceptable until Task 17's full build.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/server.ts src/lib/supabase/client.ts
git commit -m "feat: add Supabase server and browser client helpers"
```

---

### Task 7: Proxy — refresh the session on each request

**Files:**
- Create: `src/proxy.ts`

> Next.js 16 renamed Middleware to **Proxy** (`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`). The file is `src/proxy.ts` and exports a `proxy` function + `config`.

- [ ] **Step 1: Write the proxy**

`src/proxy.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the auth token and writes it back onto `response`.
  // Do not add code between createServerClient and getUser.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static image assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors in `src/proxy.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/proxy.ts
git commit -m "feat: proxy to refresh Supabase sessions"
```

---

### Task 8: Rewrite `src/lib/auth.ts` → `getUser()`; delete NextAuth routes

**Files:**
- Modify: `src/lib/auth.ts` (full rewrite)
- Delete: `src/app/api/auth/[...nextauth]/route.ts`
- Delete: `src/app/api/auth/register/route.ts`

- [ ] **Step 1: Replace `src/lib/auth.ts` entirely**

```ts
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// The authenticated user's app profile, or null if not signed in.
// Role is read fresh from the DB on every call (no JWT staleness).
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, role: true, image: true },
  });
}
```

- [ ] **Step 2: Delete the NextAuth handler and register routes**

```bash
git rm "src/app/api/auth/[...nextauth]/route.ts" src/app/api/auth/register/route.ts
```

- [ ] **Step 3: Verify no source still imports NextAuth from auth.ts**

Run: `grep -rn "handlers\|signIn\|signOut\|next-auth" src/lib/auth.ts src/app/api/auth 2>/dev/null || echo "clean"`
Expected: `clean` (the api/auth directory is now empty/gone).

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: replace NextAuth with getUser() Supabase session helper"
```

---

### Task 9: Migrate the checkout route + test (TDD)

**Files:**
- Modify: `tests/checkout.test.ts`
- Modify: `src/app/api/checkout/route.ts`

- [ ] **Step 1: Update the test to mock `getUser` (this makes it fail first)**

In `tests/checkout.test.ts` make these exact replacements:

- Line 14–16, replace the mock factory:
```ts
vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
}))
```
- Line 21, replace the import:
```ts
import { getUser } from '@/lib/auth'
```
- Line 23, replace the handle:
```ts
const mockedGetUser = vi.mocked(getUser)
```
- Line 71 (in `beforeEach`), replace the logged-in default:
```ts
  mockedGetUser.mockResolvedValue({ id: 'user_1' } as never)
```
- Line 82 (the 401 test), replace:
```ts
    mockedGetUser.mockResolvedValue(null as never)
```

- [ ] **Step 2: Run the test — expect failure**

Run: `npx vitest run tests/checkout.test.ts`
Expected: FAIL — the route still calls `auth()` (now undefined in the mock), throwing `TypeError`.

- [ ] **Step 3: Update the route handler**

In `src/app/api/checkout/route.ts`:

- Line 4, replace the import:
```ts
import { getUser } from "@/lib/auth";
```
- Lines 17–21, replace the session block:
```ts
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to book" }, { status: 401 });
    }
    const userId = user.id;
```
- Lines 139–140, replace `NEXTAUTH_URL` with `APP_URL`:
```ts
      success_url: `${process.env.APP_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/guides/${guideId}?cancelled=true`,
```

- [ ] **Step 4: Run the test — expect pass**

Run: `npx vitest run tests/checkout.test.ts`
Expected: PASS (all checkout tests green).

- [ ] **Step 5: Commit**

```bash
git add tests/checkout.test.ts src/app/api/checkout/route.ts
git commit -m "feat: checkout route uses getUser; APP_URL for Stripe redirects"
```

---

### Task 10: Migrate the availability route + test (TDD)

**Files:**
- Modify: `tests/availability.test.ts`
- Modify: `src/app/api/availability/route.ts`

- [ ] **Step 1: Update the test to mock `getUser`**

In `tests/availability.test.ts`:

- Lines 14–16, replace the mock factory:
```ts
vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
}))
```
- Line 20, replace the import:
```ts
import { getUser } from '@/lib/auth'
```
- Line 22, replace the handle:
```ts
const mockedGetUser = vi.mocked(getUser)
```
- Line 47 (in `beforeEach`), replace:
```ts
  mockedGetUser.mockResolvedValue({ id: 'user_1' } as never)
```
- Line 55 (the 401 test), replace:
```ts
    mockedGetUser.mockResolvedValue(null as never)
```

- [ ] **Step 2: Run the test — expect failure**

Run: `npx vitest run tests/availability.test.ts`
Expected: FAIL (route still calls `auth()`).

- [ ] **Step 3: Update the route handler**

In `src/app/api/availability/route.ts`:

- Line 4, replace the import:
```ts
import { getUser } from "@/lib/auth";
```
- Lines 41–48 (POST), replace:
```ts
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guide = await prisma.guide.findUnique({
    where: { userId: user.id },
  });
```
- Lines 130–133 (DELETE), replace:
```ts
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
```
- Line 142 (DELETE ownership check), replace:
```ts
  if (!slot || slot.guide.userId !== user.id) {
```

- [ ] **Step 4: Run the test — expect pass**

Run: `npx vitest run tests/availability.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/availability.test.ts src/app/api/availability/route.ts
git commit -m "feat: availability route uses getUser"
```

---

### Task 11: Migrate the guides/apply route + test (TDD)

**Files:**
- Modify: `tests/apply.test.ts`
- Modify: `src/app/api/guides/apply/route.ts`

- [ ] **Step 1: Update the test to mock `getUser`**

In `tests/apply.test.ts`:

- Lines 10–12, replace the mock factory:
```ts
vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
}))
```
- Line 16, replace the import:
```ts
import { getUser } from '@/lib/auth'
```
- Line 18, replace the handle:
```ts
const mockedGetUser = vi.mocked(getUser)
```
- Line 54 (in `beforeEach`), replace:
```ts
  mockedGetUser.mockResolvedValue({ id: 'user_1' } as never)
```
- Line 64 (the 401 test), replace:
```ts
    mockedGetUser.mockResolvedValue(null as never)
```

- [ ] **Step 2: Run the test — expect failure**

Run: `npx vitest run tests/apply.test.ts`
Expected: FAIL (route still calls `auth()`).

- [ ] **Step 3: Update the route handler**

In `src/app/api/guides/apply/route.ts`:

- Line 4, replace the import:
```ts
import { getUser } from "@/lib/auth";
```
- Lines 9–13, replace:
```ts
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to become a guide" }, { status: 401 });
    }
    const userId = user.id;
```

- [ ] **Step 4: Run the test — expect pass**

Run: `npx vitest run tests/apply.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/apply.test.ts src/app/api/guides/apply/route.ts
git commit -m "feat: guide apply route uses getUser"
```

---

### Task 12: Rewrite the login/register page for Supabase Auth

**Files:**
- Modify: `src/app/login/page.tsx`

- [ ] **Step 1: Swap the import**

Replace line 5:
```tsx
import { createClient } from '@/lib/supabase/client';
```

- [ ] **Step 2: Replace the submit handler body (lines 16–57)**

Replace the whole `handleSubmit` function with:

```tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { name: form.name } },
        });
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) {
          setError('Invalid email or password');
          setLoading(false);
          return;
        }
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  };
```

(With "Confirm email" disabled, `signUp` returns a session immediately, so the user is logged in — no separate sign-in call needed. The JSX below is unchanged.)

- [ ] **Step 3: Typecheck this file**

Run: `npx tsc --noEmit`
Expected: no errors referencing `login/page.tsx` or `next-auth/react`.

- [ ] **Step 4: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat: login/register via Supabase Auth"
```

---

### Task 13: Rewrite the apply page's auth gate

**Files:**
- Modify: `src/app/apply/page.tsx`

> The page only needs to know logged-in-or-not (role freshness is handled server-side on `/account`). Replace `useSession`/`update` with a browser-client check.

- [ ] **Step 1: Swap the import**

Replace line 5:
```tsx
import { createClient } from '@/lib/supabase/client';
```

- [ ] **Step 2: Replace the session hook (line 11) with local state**

Replace:
```tsx
  const { status, update } = useSession();
```
with:
```tsx
  const [authed, setAuthed] = useState<boolean | null>(null);
```

- [ ] **Step 3: Add an auth check effect**

Immediately after the `const router = useRouter();` line, add:
```tsx

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);
```

- [ ] **Step 4: Drop the role refresh on success (lines 72–74)**

Replace:
```tsx
      // Refresh the session so it picks up the new GUIDE role, then send the
      // guide to the dashboard — adding availability is the required next step
      await update();
      router.push('/account');
```
with:
```tsx
      // Send the guide to the dashboard — its server render reads the fresh
      // GUIDE role via getUser(). Adding availability is the required next step.
      router.push('/account');
```

- [ ] **Step 5: Update the two `status` reads in the JSX**

Replace `status === 'unauthenticated'` (line 113) with `authed === false`.
Replace `disabled={loading || status === 'loading'}` (line 225) with `disabled={loading || authed === null}`.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `apply/page.tsx` or `next-auth/react`.

- [ ] **Step 7: Commit**

```bash
git add src/app/apply/page.tsx
git commit -m "feat: apply page auth gate via Supabase browser client"
```

---

### Task 14: BookingWidget takes `isLoggedIn` from the server page

**Files:**
- Modify: `src/components/BookingWidget.tsx`
- Modify: `src/app/guides/[id]/page.tsx`

- [ ] **Step 1: Remove `useSession` from BookingWidget**

In `src/components/BookingWidget.tsx` delete line 4:
```tsx
import { useSession } from 'next-auth/react';
```

- [ ] **Step 2: Add `isLoggedIn` to the props interface**

In `interface BookingWidgetProps` (after `reviewCount: number;`, line 21) add:
```tsx
  isLoggedIn: boolean;
```

- [ ] **Step 3: Destructure the prop and drop the hook**

Replace the component signature + hook (lines 26–28):
```tsx
export default function BookingWidget({ guideId, guideType, hourlyRate, packagePrice, maxGroupSize, rating, reviewCount, isLoggedIn }: BookingWidgetProps) {
  const router = useRouter();
```

- [ ] **Step 4: Replace the three `status` reads**

- Line 96 (in `handleReserve`): `if (status !== 'authenticated') {` → `if (!isLoggedIn) {`
- Line 242 (button label): `status !== 'authenticated' ? 'Log in to Reserve' : 'Reserve'` → `!isLoggedIn ? 'Log in to Reserve' : 'Reserve'`
- Lines 246–247 (footer text): `status === 'authenticated' ? "You won't be charged yet" : 'Secure checkout via Stripe'` → `isLoggedIn ? "You won't be charged yet" : 'Secure checkout via Stripe'`

- [ ] **Step 5: Pass the prop from the guide profile page**

In `src/app/guides/[id]/page.tsx`:

- After the imports, add (line 8 area):
```tsx
import { getUser } from '@/lib/auth';
```
- Inside `GuideProfilePage`, after `const { id } = await params;` (line 11), add:
```tsx
  const user = await getUser();
```
- In the `<BookingWidget … />` (lines 106–114), add the prop:
```tsx
            <BookingWidget
              guideId={guide.id}
              guideType={guide.guideType}
              hourlyRate={guide.hourlyRate}
              packagePrice={guide.packagePrice}
              maxGroupSize={guide.maxGroupSize}
              rating={guide.rating}
              reviewCount={guide.reviewCount}
              isLoggedIn={!!user}
            />
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `BookingWidget.tsx` or `guides/[id]/page.tsx`.

- [ ] **Step 7: Commit**

```bash
git add src/components/BookingWidget.tsx "src/app/guides/[id]/page.tsx"
git commit -m "feat: BookingWidget gets isLoggedIn from server, drops useSession"
```

---

### Task 15: Split NavActions into server + client; drop Providers

**Files:**
- Create: `src/components/LogoutButton.tsx`
- Modify: `src/components/NavActions.tsx` (full rewrite → server component)
- Modify: `src/app/layout.tsx`
- Delete: `src/components/Providers.tsx`

- [ ] **Step 1: Create the client logout button**

`src/components/LogoutButton.tsx`:

```tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="mock-nav-link"
      style={{ fontSize: '15px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-gray)' }}
    >
      Log out
    </button>
  );
}
```

- [ ] **Step 2: Rewrite NavActions as an async server component**

Replace `src/components/NavActions.tsx` entirely:

```tsx
import React from 'react';
import Link from 'next/link';
import { getUser } from '@/lib/auth';
import LogoutButton from './LogoutButton';

export default async function NavActions() {
  const user = await getUser();

  return (
    <div className="mock-nav-actions">
      {user ? (
        <>
          <Link href="/bookings" className="mock-nav-link" style={{ fontSize: '15px', fontWeight: 500 }}>My bookings</Link>
          {user.role === 'GUIDE' ? (
            <Link href="/account" className="mock-nav-link" style={{ fontSize: '15px', fontWeight: 500 }}>Guide dashboard</Link>
          ) : (
            <Link href="/apply" className="btn btn-pill btn-sm btn-primary">Become a host</Link>
          )}
          <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--neutral-dark)' }}>
            {user.name || user.email?.split('@')[0]}
          </span>
          <LogoutButton />
        </>
      ) : (
        <>
          <Link href="/login" className="mock-nav-link" style={{ fontSize: '15px', fontWeight: 500 }}>Log in</Link>
          <Link href="/apply" className="btn btn-pill btn-sm btn-primary">Become a host</Link>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Remove Providers from the layout**

In `src/app/layout.tsx`:
- Delete line 4: `import Providers from "@/components/Providers";`
- Replace line 32 `<Providers>{children}</Providers>` with `{children}`.

- [ ] **Step 4: Delete the Providers file**

```bash
git rm src/components/Providers.tsx
```

- [ ] **Step 5: Verify no `next-auth` imports remain in src**

Run: `grep -rn "next-auth" src/ || echo "clean"`
Expected: `clean`.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (All call sites migrated by now.)

- [ ] **Step 7: Commit**

```bash
git add src/components/NavActions.tsx src/components/LogoutButton.tsx src/app/layout.tsx
git commit -m "feat: server-rendered NavActions with Supabase, remove SessionProvider"
```

---

### Task 16: Rewrite the seed for Supabase auth users

**Files:**
- Modify: `prisma/seed.ts` (full rewrite)

> Seed runs against **Supabase** (where `auth.users` + the trigger exist). Point `DATABASE_URL` at the Supabase pooler and set `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY` before running.

- [ ] **Step 1: Replace `prisma/seed.ts` entirely**

```ts
import { createClient } from '@supabase/supabase-js'
import { prisma } from '../src/lib/prisma'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// A date N days from now, normalized to midnight UTC (AvailabilitySlot.date is a DATE column)
function daysFromNow(days: number): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

// Create the auth user (idempotent) and return its id. The DB trigger creates
// the matching public.User row; we return the id to attach a guide profile.
async function ensureAuthUser(email: string, password: string, name: string): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (data?.user) return data.user.id

  // Already exists — find the id by paging the user list.
  if (error) {
    for (let page = 1; page <= 10; page++) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
      const found = list.users.find((u) => u.email === email)
      if (found) return found.id
      if (list.users.length < 200) break
    }
  }
  throw new Error(`Could not create or find auth user for ${email}: ${error?.message}`)
}

async function main() {
  const ahmadId = await ensureAuthUser('ahmad.guide@example.com', 'password123', 'Ahmad Al-Dimashqi')
  const laylaId = await ensureAuthUser('layla.guide@example.com', 'password123', 'Layla Haddad')

  // Student guide: hired by the hour
  await prisma.user.update({
    where: { id: ahmadId },
    data: {
      name: 'Ahmad Al-Dimashqi',
      role: 'GUIDE',
      guideProfile: {
        upsert: {
          create: {
            bio: 'History student and expert in Umayyad history. I love showing visitors the ancient alleys and the Umayyad Mosque.',
            city: 'Damascus',
            languages: ['Arabic', 'English'],
            guideType: 'STUDENT',
            university: 'Damascus University',
            hourlyRate: 10.0,
            rating: 4.9,
            reviewCount: 42,
            isVerified: true,
          },
          update: {},
        },
      },
    },
  })

  // Professional guide: sells a fixed tour package
  await prisma.user.update({
    where: { id: laylaId },
    data: {
      name: 'Layla Haddad',
      role: 'GUIDE',
      guideProfile: {
        upsert: {
          create: {
            bio: 'Licensed tour guide working with Aleppo Heritage Tours. My signature package covers the Citadel, the old souks, and traditional food stops.',
            city: 'Aleppo',
            languages: ['Arabic', 'English', 'French'],
            guideType: 'PROFESSIONAL',
            packagePrice: 25.0,
            packageDuration: 180,
            maxGroupSize: 4,
            rating: 4.7,
            reviewCount: 118,
            isVerified: true,
          },
          update: {},
        },
      },
    },
  })

  // Open upcoming availability for both guides so they are bookable
  const guides = await prisma.guide.findMany({
    where: { userId: { in: [ahmadId, laylaId] } },
  })
  for (const guide of guides) {
    await prisma.availabilitySlot.createMany({
      data: [
        { guideId: guide.id, date: daysFromNow(2), startTime: '09:00', endTime: '13:00' },
        { guideId: guide.id, date: daysFromNow(4), startTime: '10:00', endTime: '16:00' },
        { guideId: guide.id, date: daysFromNow(7), startTime: '09:00', endTime: '12:00' },
      ],
      skipDuplicates: true,
    })
  }

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

- [ ] **Step 2: Typecheck the seed**

Run: `npx tsc --noEmit`
Expected: no errors in `prisma/seed.ts`.

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed demo guides via Supabase admin API"
```

---

### Task 17: Remove dead dependencies + full verification

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Remove the NextAuth-era packages**

Run: `npm uninstall next-auth @auth/prisma-adapter bcryptjs @types/bcryptjs`
Expected: all four removed from `package.json`.

- [ ] **Step 2: Confirm nothing imports them**

Run: `grep -rn "next-auth\|@auth/prisma-adapter\|bcryptjs" src/ prisma/ tests/ || echo "clean"`
Expected: `clean`.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all suites PASS (apply, availability, checkout, booking-confirmation, guides-search, webhook).

- [ ] **Step 4: Full build / typecheck**

Run: `npm run build`
Expected: `prisma generate` succeeds, `next build` compiles with no type errors.

- [ ] **Step 5: Apply migrations to Supabase**

Point `DATABASE_URL` at the Supabase session pooler, then:
Run: `npm run migrate:deploy`
Expected: both migrations applied. In the Supabase dashboard, **Database → Triggers** shows `on_auth_user_created` on `auth.users`.

- [ ] **Step 6: Seed Supabase**

Ensure `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY` are set, then:
Run: `npx prisma db seed`
Expected: `Seed completed successfully.` Two guides visible in the `Guide` table; two users in `auth.users` and in `public."User"`.

- [ ] **Step 7: Manual end-to-end check**

Run: `npm run dev` (with `.env` pointed at Supabase). Verify:
1. Sign up a new email → redirected home, nav shows your name + "Become a host".
2. In Supabase, a `public."User"` row exists with role `TOURIST`.
3. Log out → nav shows "Log in". Log back in → nav shows your name.
4. Go to `/apply`, submit a guide offer → land on `/account`; nav now shows "Guide dashboard" **without re-login**.
5. Open a seeded guide's page → "Reserve" (not "Log in to Reserve") → checkout redirects to Stripe.
6. Homepage lists the two seeded guides.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove next-auth, prisma-adapter, bcryptjs"
```

---

## Self-Review

**Spec coverage:**
- Supabase config (pooler, keys, confirm-email off) → Prerequisites. ✅
- Schema reset + User-as-profile → Task 3. ✅
- No FK to `auth.users` → schema has none (Task 3). ✅
- Trigger with local-Postgres guard → Task 5. ✅
- Migrations reset + deploy workflow → Tasks 4, 17. ✅
- `server.ts`/`client.ts`/`proxy.ts`/`getUser()` → Tasks 6, 7, 8. ✅
- All 6 call sites migrated → Tasks 9–15. ✅
- login/register, apply, BookingWidget, NavActions/Providers, checkout APP_URL → Tasks 9, 12, 13, 14, 15. ✅
- Seed via admin API → Task 16. ✅
- Deps add/remove + env → Tasks 1, 2, 17. ✅
- Tests mock `getUser` → Tasks 9–11. ✅
- Verification criteria (tests, deploy, E2E, seeded guides) → Task 17. ✅

**Placeholder scan:** No TBD/TODO; every code step shows full content. ✅

**Type consistency:** `getUser()` returns `{ id, email, name, role, image } | null` (Task 8); consumed as `user.id`, `user.role`, `user.name`, `user.email` (Tasks 9–15); tests mock `{ id: 'user_1' }`/`null` (Tasks 9–11); `BookingWidget` prop `isLoggedIn: boolean` defined and passed (Task 14). Consistent. ✅

## Deviation note

The spec sketched the apply page as "server gate + client form". Task 13 keeps it a single client component using the browser client for the logged-in check instead — this is the more surgical change (no 200-line form split) and satisfies the intent: role freshness is guaranteed by the server-rendered `/account` page reading `getUser()`.
