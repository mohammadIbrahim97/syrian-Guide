# 🇸🇾 SyriaGuide

A tourism marketplace that matches travelers with local Syrian guides. Guides — university students (hired by the hour) or professionals (fixed tour packages) — publish an offer and open availability slots; tourists find a guide, book a slot, and pay online.

**Stack:** Next.js 16 (App Router) · Prisma 7 + PostgreSQL · NextAuth v5 (credentials) · Stripe Checkout · Vitest

## Getting started

Prerequisites: Node.js 22+, a PostgreSQL database, Stripe test-mode keys.

```bash
# 1. Configure the environment FIRST — `npm install` runs `prisma generate`,
#    which fails if DATABASE_URL is not set.
cp .env.example .env   # then fill in real values

# 2. Install dependencies
npm install

# 3. Apply the database schema and seed demo guides
npm run migrate:deploy
npx prisma db seed

# 4. Run the dev server
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

All five are required in production. See [.env.example](.env.example) for details and examples.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Must be set before `npm install` (postinstall runs `prisma generate`). |
| `AUTH_SECRET` | NextAuth v5 session/JWT secret (`openssl rand -base64 32`). Legacy `NEXTAUTH_SECRET` also works. |
| `NEXTAUTH_URL` | Public base URL of the app; used for Stripe Checkout redirect URLs. |
| `STRIPE_SECRET_KEY` | Stripe API secret key. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the webhook endpoint. **Required** — the webhook rejects unsigned events, and without it bookings are never confirmed and abandoned checkouts never release their slots. |

## Deployment (minimal path)

The intended production setup is a managed platform (e.g. **Vercel**) plus a **managed Postgres** (Neon, Supabase, Railway, …):

1. Create the Postgres database and set all five environment variables in the platform (with `NEXTAUTH_URL` set to the production domain).
2. Apply migrations against the production database (see [Database & migrations](#database--migrations-prisma) below — this does **not** happen during the app build).
3. Deploy. The build is `prisma generate && next build`; no extra configuration is needed.
4. In the Stripe dashboard, add a webhook endpoint pointing at `https://<your-domain>/api/webhook` subscribed to `checkout.session.completed` and `checkout.session.expired`, then put its signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy.

> **Note:** `Dockerfile` and `docker-compose.yml` are **local development only** (dev server, hardcoded dev credentials, no Stripe config). They are not a production deployment path.

### Database & migrations (Prisma)

**Connection string — must be a direct TCP `postgres://` URL.** The app connects through a `pg` connection pool (`src/lib/prisma.ts`), so `DATABASE_URL` has to be a standard PostgreSQL connection string. If you use **Prisma Postgres**, copy its **direct connection** string — *not* the `prisma+postgres://` (Accelerate) URL, which this driver-adapter setup cannot use. Neon, Supabase, Railway, etc. work as-is.

**Applying migrations.** The app build only runs `prisma generate`; it never touches the schema. Apply migrations one of two ways:

- **Automated (recommended):** the [`Deploy migrations`](.github/workflows/deploy-migrations.yml) GitHub Action runs `prisma migrate deploy` on every push to `main`. Enable it by adding a `DATABASE_URL` repository secret (Settings → Secrets and variables → Actions) with the production connection string. Without the secret the job no-ops, so it never blocks a merge. You can also trigger it by hand from the Actions tab.
- **Manual:** `DATABASE_URL="<production-url>" npm run migrate:deploy`.

Run migrations on first deploy and after every schema change. Seeding demo guides is optional: `DATABASE_URL="<production-url>" npx prisma db seed`.

> The GitHub Action runner must be able to reach the database over the network (Prisma Postgres, Neon, Supabase, etc. are internet-reachable). For a database that is only reachable from inside your hosting platform, run `npm run migrate:deploy` from there instead.

## Project notes

- Payouts to guides are manual for now: Stripe collects into the platform account and the operator settles with guides directly.
- Roadmap and scope decisions live in the GitHub issues — see the "Minimal launch" epic.
- Design tokens and visual guidelines: [docs/design-system.md](docs/design-system.md) (interactive preview in `index.html` / `styles.css`).
