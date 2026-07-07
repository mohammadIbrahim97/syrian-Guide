# 🇸🇾 SyriaGuide

A tourism marketplace that matches travelers with local Syrian guides. Guides — university students (hired by the hour) or professionals (fixed tour packages) — publish an offer and open availability slots; tourists find a guide, book a slot, and pay online.

**Stack:** Next.js 16 (App Router) · Prisma 7 + PostgreSQL · Supabase Auth · Stripe Checkout · Vitest

## Getting started

Prerequisites: Node.js 22+, a Supabase project, Stripe test-mode keys.

```bash
# 1. Create a Supabase project, then in Authentication → Providers disable
#    "Confirm email" (demo accounts sign in immediately, no email step yet).
#    Grab the session-pooler DATABASE_URL and API keys from Settings.

# 2. Configure the environment — `npm install` runs `prisma generate`,
#    which fails if DATABASE_URL is not set.
cp .env.example .env   # then fill in real values

# 3. Install dependencies
npm install

# 4. Apply the database schema and seed demo guides
npm run migrate:deploy
npx prisma db seed
npm run setup:storage   # one-time: create the public Storage buckets (avatars, gallery, covers)

# 5. Run the dev server
npm run dev            # http://localhost:3000
```

To receive Stripe webhooks locally (bookings are only confirmed via verified payment events):

```bash
stripe listen --forward-to localhost:3000/api/webhook
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET in .env
```

### Tests & lint

```bash
npm test
npm run lint
```

## Environment variables

All are required in production. See [.env.example](.env.example) for details and examples.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Must be set before `npm install` (postinstall runs `prisma generate`). Use the Supabase session pooler for the app/production; use the local Docker Postgres (`docker compose up -d db`) when authoring migrations with `prisma migrate dev`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (Settings → API). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key (Settings → API). |
| `SUPABASE_SECRET_KEY` | Supabase secret key, server-only. Used by the seed script to create demo auth users, and later by Storage upload routes. Never expose to the client. |
| `APP_URL` | Public base URL of the app; used for Stripe Checkout redirect URLs. |
| `STRIPE_SECRET_KEY` | Stripe API secret key. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the webhook endpoint. **Required** — the webhook rejects unsigned events, and without it bookings are never confirmed and abandoned checkouts never release their slots. |
| `NEXT_PUBLIC_SENTRY_DSN` | **Optional.** Sentry error-monitoring DSN. Leave unset to disable Sentry entirely (default); set it to activate error capture. |

## Deployment (minimal path)

The intended production setup is a managed platform (e.g. **Vercel**) plus the **Supabase** project created above (Postgres + Auth):

1. Set all environment variables in the platform, with `DATABASE_URL` pointed at the Supabase session pooler and `APP_URL` set to the production domain.
2. Apply migrations against the production database (see [Database & migrations](#database--migrations-prisma) below — this does **not** happen during the app build).
3. Run `npm run setup:storage` once per environment to create the public `avatars`, `gallery`, and `covers` Storage buckets (idempotent; safe to re-run).
4. Deploy. The build is `prisma generate && next build`; no extra configuration is needed.
5. In the Stripe dashboard, add a webhook endpoint pointing at `https://<your-domain>/api/webhook` subscribed to `checkout.session.completed` and `checkout.session.expired`, then put its signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy.

> **Note:** `Dockerfile` and `docker-compose.yml` are **local development only** (dev server, hardcoded dev credentials, no Stripe config). They are not a production deployment path.

### Database & migrations (Prisma)

**Connection string — must be a standard TCP `postgres://` URL.** The app connects through a `pg` connection pool (`src/lib/prisma.ts`). Use the **Supabase session pooler** string (port 5432, `*.pooler.supabase.com`) — it is IPv4-reachable, whereas the direct `db.<ref>.supabase.co` host is IPv6-only. A `prisma+postgres://` (Accelerate) URL cannot be used with this driver-adapter setup.

**Applying migrations.** The app build only runs `prisma generate`; it never touches the schema. Apply migrations one of two ways:

- **Automated (recommended):** the [`Deploy migrations`](.github/workflows/deploy-migrations.yml) GitHub Action runs `prisma migrate deploy` on every push to `main`. Enable it by adding a `DATABASE_URL` repository secret (Settings → Secrets and variables → Actions) with the production connection string. Without the secret the job no-ops, so it never blocks a merge. You can also trigger it by hand from the Actions tab.
- **Manual:** `DATABASE_URL="<production-url>" npm run migrate:deploy`.

Run migrations on first deploy and after every schema change. Seeding demo guides is optional: `npx prisma db seed` — it also needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` set, since the seed creates real Supabase auth users.

> The GitHub Action runner must be able to reach the database over the network (Prisma Postgres, Neon, Supabase, etc. are internet-reachable). For a database that is only reachable from inside your hosting platform, run `npm run migrate:deploy` from there instead.

## Project notes

- Payouts to guides are manual for now: Stripe collects into the platform account and the operator settles with guides directly.
- Roadmap and scope decisions live in the GitHub issues — see the "Minimal launch" epic.
- Design tokens and visual guidelines: [docs/design-system.md](docs/design-system.md) (interactive preview in `index.html` / `styles.css`).
