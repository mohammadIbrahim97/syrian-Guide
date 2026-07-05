# Launch Hygiene Bundle — Design

**Date:** 2026-07-05
**Status:** Approved
**Scope:** Password-reset flow, confirm-email readiness, legal pages, dormant error monitoring. Email delivery stays on Supabase's built-in sender (no domain/SMTP yet).

## Context

Phase 1 (Supabase Auth migration) shipped without a password-reset flow, with email confirmation disabled, no legal pages, and no error monitoring. All four were accepted gaps for the migration; this bundle closes them at minimal-launch depth.

**Decisions locked during brainstorming:**
- All four items in scope (user explicitly included error monitoring).
- Built-in Supabase sender for now — rate-limited (a few emails/hour), fine for testing; real SMTP + domain deferred.
- Confirm-email dashboard toggle stays OFF; the app becomes ready so flipping it later is zero-code.
- Sentry as the monitoring tool, fully dormant until `NEXT_PUBLIC_SENTRY_DSN` is set.

## Components

### 1. `/auth/confirm` route (GET) — shared auth-email plumbing

Handles both Supabase verification link styles in one route:
- `?code=` — default email templates (PKCE). Server-side `exchangeCodeForSession(code)` works because `@supabase/ssr` persists the code verifier in a cookie. Caveat (accepted): the link must be opened in the same browser that requested it.
- `?token_hash=&type=` — the template style used once custom SMTP/templates exist. `verifyOtp({ type, token_hash })`. Works cross-browser.

On success: session cookies set, redirect to `?next=` (sanitized by resolving it against the request origin and rejecting it — falling back to `/` — if the resolved origin differs; comparing the parsed origin is immune to URL-normalization tricks like `/\evil.com` or a tab-injected `/\t//evil.com` that a `/`-vs-`//` string check would let through — no open redirect). On any failure: redirect `/login?error=link-expired`.

### 2. Password reset

- `/login` gets a "Forgot password?" link (login mode only).
- `/forgot-password` (client page): email form → `resetPasswordForEmail(email, { redirectTo: origin + '/auth/confirm?next=/reset-password' })` → always flips to a generic "check your inbox" state (no account enumeration).
- `/reset-password` (client page): checks for a session on mount (the confirm route granted it). No session → "link invalid or expired" + link to `/forgot-password`. With session: new-password form (min 6 chars) → `updateUser({ password })` → home + refresh.

### 3. Confirm-email readiness

`/login` register branch: `signUp` response is inspected — if no `session` is granted (confirmation ON), render a "Check your inbox to confirm your account" state instead of the current silent redirect-home-logged-out. `/auth/confirm` (above) already handles the confirmation link when the toggle is flipped.

### 4. Legal pages

`/impressum`, `/datenschutz`, `/agb` — static server components (plain logo header, no NavActions, so they stay statically renderable), German content:
- **Impressum**: § 5 DDG structure with loud `[PLATZHALTER: …]` blocks for name/address/email.
- **Datenschutz**: reflects the actual stack — Supabase (Postgres + Auth, EU region eu-central-1), Stripe Checkout, auth cookies only, no analytics/tracking, hosting TBD placeholder.
- **AGB**: minimal marketplace terms draft (roles, booking/payment via Stripe, manual payouts, liability placeholder).
- Every page carries an HTML comment + visible placeholder marking it as a template requiring the operator's review (not legal advice).
- Footer links "Impressum · Datenschutz · AGB" added to the existing footers (homepage, guide profile page) and to the legal pages themselves.

### 5. Error monitoring (Sentry, dormant)

`@sentry/nextjs` wired via Next 16 conventions: `src/instrumentation.ts` (server/edge init + `onRequestError`), `src/instrumentation-client.ts` (browser init), `src/app/global-error.tsx`. All inits use `dsn: process.env.NEXT_PUBLIC_SENTRY_DSN` and `enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN` — a no-op until the DSN exists. `next.config.ts` wrapped with `withSentryConfig` (silent; no source-map upload without auth token). `.env.example` + README document the optional var.

## Error handling

- Confirm route: every failure path lands on `/login?error=link-expired`; login page shows a friendly message for that query param.
- Forgot-password: generic success regardless of account existence; Supabase rate-limit errors surface as a soft "try again later".
- Reset-password: `updateUser` errors (weak/same password) shown inline.

## Verification

1. TDD on `/auth/confirm` (mocked server client): code path, token_hash path, failure → link-expired, open-redirect guard.
2. Full suite + production build green (Sentry dormant must not break the build).
3. Automated E2E without email delivery: `admin.generateLink({ type: 'recovery' })` → GET `/auth/confirm?token_hash=…` → assert redirect to `/reset-password` + session cookies; second link → `verifyOtp` + `updateUser` client-side → `signInWithPassword` with the new password succeeds. Fresh test user, cleaned up.
4. Dev-server smoke on all new pages.

## Out of scope

SMTP provider + domain, flipping confirm-email ON, Supabase Site URL config, email template customization, Sentry account creation, filling the legal placeholders.
