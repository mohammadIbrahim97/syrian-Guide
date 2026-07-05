# Launch Hygiene Bundle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Password-reset flow, confirm-email readiness, German legal-page templates, and dormant Sentry monitoring — closing the four accepted launch gaps at minimal depth.

**Architecture:** One `/auth/confirm` GET route verifies both Supabase link styles and grants the session; two small client pages drive the reset UX; the login page learns two new states; three static legal pages hang off the existing visual style; Sentry initializes only when a DSN env var exists.

**Tech Stack:** Next.js 16 App Router (`@supabase/ssr` server client in a Route Handler), Supabase Auth (`resetPasswordForEmail`, `verifyOtp`, `exchangeCodeForSession`, `updateUser`), `@sentry/nextjs`, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-07-05-launch-hygiene-design.md`

**Conventions for every task:** commit after your task passes its verification; stage ONLY your task's files; never stage the unrelated architecture-doc moves in the working tree; do NOT push (controller pushes at the end); pages must visually match the existing login page style (same card/input/button inline styles).

---

### Task A: `/auth/confirm` route + tests (TDD)

**Files:**
- Test: `tests/auth-confirm.test.ts` (new)
- Create: `src/app/auth/confirm/route.ts`

- [ ] **Step 1: Write the failing test** — `tests/auth-confirm.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockedExchange = vi.fn()
const mockedVerifyOtp = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession: mockedExchange, verifyOtp: mockedVerifyOtp },
  })),
}))

import { GET } from '@/app/auth/confirm/route'

function confirmRequest(query: string) {
  return new Request(`http://localhost/auth/confirm${query}`)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedExchange.mockResolvedValue({ error: null })
  mockedVerifyOtp.mockResolvedValue({ error: null })
})

describe('GET /auth/confirm (auth email link verification)', () => {
  it('exchanges a PKCE code and redirects to next', async () => {
    const res = await GET(confirmRequest('?code=abc123&next=/reset-password') as never)
    expect(mockedExchange).toHaveBeenCalledWith('abc123')
    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.headers.get('location')).toBe('http://localhost/reset-password')
  })

  it('verifies a token_hash link and redirects to next', async () => {
    const res = await GET(confirmRequest('?token_hash=th_1&type=recovery&next=/reset-password') as never)
    expect(mockedVerifyOtp).toHaveBeenCalledWith({ type: 'recovery', token_hash: 'th_1' })
    expect(res.headers.get('location')).toBe('http://localhost/reset-password')
  })

  it('defaults next to /', async () => {
    const res = await GET(confirmRequest('?code=abc123') as never)
    expect(res.headers.get('location')).toBe('http://localhost/')
  })

  it('rejects protocol-relative next (no open redirect)', async () => {
    const res = await GET(confirmRequest('?code=abc123&next=//evil.example') as never)
    expect(res.headers.get('location')).toBe('http://localhost/')
  })

  it('rejects absolute-URL next (no open redirect)', async () => {
    const res = await GET(confirmRequest('?code=abc123&next=https://evil.example/x') as never)
    expect(res.headers.get('location')).toBe('http://localhost/')
  })

  it('redirects to login?error=link-expired when the code exchange fails', async () => {
    mockedExchange.mockResolvedValue({ error: { message: 'expired' } })
    const res = await GET(confirmRequest('?code=bad') as never)
    expect(res.headers.get('location')).toBe('http://localhost/login?error=link-expired')
  })

  it('redirects to login?error=link-expired when verifyOtp fails', async () => {
    mockedVerifyOtp.mockResolvedValue({ error: { message: 'expired' } })
    const res = await GET(confirmRequest('?token_hash=bad&type=recovery') as never)
    expect(res.headers.get('location')).toBe('http://localhost/login?error=link-expired')
  })

  it('redirects to login?error=link-expired with no usable params', async () => {
    const res = await GET(confirmRequest('') as never)
    expect(mockedExchange).not.toHaveBeenCalled()
    expect(mockedVerifyOtp).not.toHaveBeenCalled()
    expect(res.headers.get('location')).toBe('http://localhost/login?error=link-expired')
  })
})
```

- [ ] **Step 2: Run — expect failure** (module not found): `npx vitest run tests/auth-confirm.test.ts`

- [ ] **Step 3: Implement** — `src/app/auth/confirm/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Verifies Supabase auth email links (password recovery, and signup
// confirmation once that is enabled). Supports both link styles:
//  - ?code=…                  default templates (PKCE; verifier lives in a cookie)
//  - ?token_hash=…&type=…     custom templates (works cross-browser)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  // Same-origin relative paths only — no open redirect.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, request.url));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(safeNext, request.url));
  }

  return NextResponse.redirect(new URL("/login?error=link-expired", request.url));
}
```

- [ ] **Step 4: Run — expect 8/8 pass**, then full suite (49 existing + 8 new = 57): `npx vitest run`
- [ ] **Step 5: Commit** — `feat: auth email link verification route`

---

### Task B: login page states + `/forgot-password` page

**Files:**
- Modify: `src/app/login/page.tsx`
- Create: `src/app/forgot-password/page.tsx`

Login page changes (keep ALL existing styling; the card/JSX structure stays):

- [ ] **Step 1: confirmation-sent state.** Add `const [confirmationSent, setConfirmationSent] = useState(false);` next to the other state hooks. In the register branch of `handleSubmit`, capture the response and handle the no-session case (confirmation ON):

```tsx
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { name: form.name } },
        });
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        if (!data.session) {
          // Email confirmation is enabled — no session until the link is clicked.
          setConfirmationSent(true);
          setLoading(false);
          return;
        }
```

In the JSX, when `confirmationSent` is true render (in place of the `<form>` and the toggle row, inside the same card):

```tsx
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '15px', color: 'var(--neutral-dark)', marginBottom: '12px', fontWeight: 600 }}>
                Check your inbox
              </p>
              <p style={{ fontSize: '14px', color: 'var(--neutral-gray)', margin: 0 }}>
                We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account, then log in.
              </p>
            </div>
```

- [ ] **Step 2: link-expired banner.** The confirm route redirects failures to `/login?error=link-expired`. Read it via `useSearchParams` (add `import { useRouter, useSearchParams } from 'next/navigation';`, then `const searchParams = useSearchParams();` and seed the error state: `useState(searchParams.get('error') === 'link-expired' ? 'That link is invalid or has expired. Please request a new one.' : '')`). NOTE: `useSearchParams` requires a Suspense boundary in App Router pages — wrap the exported component: rename the current component to `LoginForm` (not exported) and export

```tsx
export default function LoginPage() {
  return (
    <React.Suspense>
      <LoginForm />
    </React.Suspense>
  );
}
```

- [ ] **Step 3: "Forgot password?" link.** Below the submit button (login mode only — inside `{!isRegister && (...)}`), matching the existing toggle-row styling:

```tsx
            {!isRegister && (
              <div style={{ marginTop: '12px', textAlign: 'center' }}>
                <Link href="/forgot-password" style={{ fontSize: '14px', color: 'var(--neutral-gray)', textDecoration: 'underline' }}>
                  Forgot password?
                </Link>
              </div>
            )}
```

- [ ] **Step 4: `/forgot-password` page.** New client page, same header/card skeleton as the login page (copy the header + card wrapper). Content: heading "Reset your password", sub-text, one email input, submit button "Send reset link". Submit handler:

```tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });
    if (error && error.status === 429) {
      setError('Too many requests — please try again in a few minutes.');
      setLoading(false);
      return;
    }
    // Deliberately generic (no account enumeration).
    setSent(true);
    setLoading(false);
  };
```

`sent === true` replaces the form with: "If an account exists for **{email}**, a password-reset link is on its way. The link works in this browser." Plus a "Back to login" link.

- [ ] **Step 5: Verify** — `npx tsc --noEmit` clean for both files; `npx vitest run` still green; commit `feat: forgot-password page and login confirmation states`.

---

### Task C: `/reset-password` page

**Files:**
- Create: `src/app/reset-password/page.tsx`

- [ ] **Step 1:** New client page, same header/card skeleton. On mount, check the session with the browser client (`supabase.auth.getUser()` → `setAuthed(!!data.user)`, tri-state like the apply page). States:
  - `authed === null`: "Checking your link…"
  - `authed === false`: "This link is invalid or has expired." + Link to `/forgot-password` ("Request a new one").
  - `authed === true`: form with one password input (`minLength={6}`, placeholder "New password (at least 6 characters)") and submit "Set new password". Handler:

```tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push('/');
    router.refresh();
  };
```

- [ ] **Step 2: Verify** — tsc clean, suite green, commit `feat: reset-password page`.

---

### Task D: legal pages + footer links

**Files:**
- Create: `src/app/impressum/page.tsx`, `src/app/datenschutz/page.tsx`, `src/app/agb/page.tsx`
- Modify: `src/app/page.tsx` (footer), `src/app/guides/[id]/page.tsx` (footer)

- [ ] **Step 1: shared shape.** Each legal page is a **server component** (no `'use client'`, no NavActions — statically renderable): plain header (logo linking home, same header JSX as the login page), `<main>` with a max-width 800px white card containing the content, and a small footer row linking the other two legal pages + "© 2026 SyriaGuide". Set `export const metadata = { title: '<PageName> — SyriaGuide' }`.

- [ ] **Step 2: content (German).** Write full German content per page. Structure to follow — the implementer writes complete prose for each section, inserting loud placeholders exactly like `[PLATZHALTER: Vollständiger Name]` wherever operator data is unknown:
  - **Impressum** (`/impressum`): "Angaben gemäß § 5 DDG" — Name, Anschrift, Kontakt (E-Mail), Verantwortlicher i.S.d. § 18 Abs. 2 MStV; Haftungsausschluss für externe Links. Placeholders for name/address/email.
  - **Datenschutzerklärung** (`/datenschutz`): Verantwortlicher (placeholder); Hosting ([PLATZHALTER: Hosting-Anbieter nach Deployment]); Datenverarbeitung durch **Supabase** (Datenbank + Authentifizierung, Region EU eu-central-1 Frankfurt — E-Mail-Adresse, Name, Passwort-Hash, Buchungsdaten); **Stripe** als Zahlungsdienstleister (Weiterleitung zu Stripe Checkout, keine Kartendaten auf unseren Servern); **Cookies**: ausschließlich technisch notwendige Auth-Session-Cookies, kein Tracking/keine Analyse-Tools; Rechte der Betroffenen (Auskunft, Berichtigung, Löschung, Beschwerde); Speicherdauer.
  - **AGB** (`/agb`): Geltungsbereich; Vertragsverhältnis (Plattform vermittelt zwischen Reisenden und Guides; Vertrag über die Tour kommt zwischen Nutzer und Guide zustande); Buchung & Bezahlung (Stripe, Preise inkl. Servicegebühr); Stornierung ([PLATZHALTER: Stornierungsbedingungen]); Pflichten der Nutzer; Haftung ([PLATZHALTER: rechtliche Prüfung erforderlich]); Schlussbestimmungen.
  - EVERY page starts with an HTML comment `{/* TEMPLATE — vor Launch prüfen und Platzhalter ersetzen. Keine Rechtsberatung. */}` and ends with a small gray note: "Dieses Dokument ist eine Vorlage und wird vor dem offiziellen Start rechtlich geprüft."

- [ ] **Step 3: footer links.** In `src/app/page.tsx` and `src/app/guides/[id]/page.tsx`, locate the existing `<footer>` (the row with the © line) and add next to/below the © paragraph:

```tsx
          <p style={{ fontSize: '14px', color: 'var(--neutral-gray)', margin: 0 }}>
            <Link href="/impressum" style={{ color: 'var(--neutral-gray)' }}>Impressum</Link>
            {' · '}
            <Link href="/datenschutz" style={{ color: 'var(--neutral-gray)' }}>Datenschutz</Link>
            {' · '}
            <Link href="/agb" style={{ color: 'var(--neutral-gray)' }}>AGB</Link>
          </p>
```

(Adjust placement to the footer's flex layout so it doesn't break alignment; homepage footer may differ from guide page footer — match each.)

- [ ] **Step 4: Verify** — tsc clean; `curl` each page returns 200 with German content; footers render the links; commit `feat: legal page templates (Impressum, Datenschutz, AGB)`.

---

### Task E: Sentry (dormant until DSN)

**Files:**
- Modify: `package.json` (+ `@sentry/nextjs`), `next.config.ts`, `.env.example`, `README.md`
- Create: `src/instrumentation.ts`, `src/instrumentation-client.ts`, `src/app/global-error.tsx`

- [ ] **Step 1:** `npm install @sentry/nextjs`

- [ ] **Step 2:** `src/instrumentation.ts`:

```ts
import * as Sentry from "@sentry/nextjs";

export async function register() {
  // One init covers the nodejs and edge server runtimes; no-op without a DSN.
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}

export const onRequestError = Sentry.captureRequestError;
```

- [ ] **Step 3:** `src/instrumentation-client.ts`:

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

- [ ] **Step 4:** `src/app/global-error.tsx`:

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>Something went wrong</h1>
          <p style={{ color: "#666" }}>Please refresh the page or try again later.</p>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 5:** `next.config.ts` — wrap the export (keep the existing `nextConfig` object untouched):

```ts
import { withSentryConfig } from "@sentry/nextjs";
// … existing nextConfig …
export default withSentryConfig(nextConfig, {
  silent: true,
  telemetry: false,
  // Source-map upload activates only when SENTRY_AUTH_TOKEN/org/project exist.
});
```

- [ ] **Step 6:** `.env.example` — append:

```bash
# OPTIONAL: Sentry error monitoring. Leave unset to disable entirely.
# Create a (free) Sentry project and paste its DSN to activate.
# NEXT_PUBLIC_SENTRY_DSN=""
```

README env table gets a matching optional row.

- [ ] **Step 7: Verify** — `npm run build` succeeds with NO Sentry env vars set (warnings OK, errors not); `npm test` green; commit `feat: dormant Sentry error monitoring (activates via NEXT_PUBLIC_SENTRY_DSN)`.

---

### Task F: end-to-end verification (controller-run)

- [ ] Full suite + `npm run build` + dev-server boot.
- [ ] E2E reset flow without email delivery (script): create fresh auth user → `admin.generateLink({ type: 'recovery', email })` → GET `http://localhost:3000/auth/confirm?token_hash=<hashed_token>&type=recovery&next=/reset-password` with manual redirect → assert 3xx to `/reset-password` AND `Set-Cookie` contains the session → second `generateLink` → `verifyOtp` + `updateUser({ password: NEW })` via anon client → `signInWithPassword(NEW)` succeeds → cleanup user.
- [ ] Smoke: `/forgot-password`, `/reset-password`, `/impressum`, `/datenschutz`, `/agb` all 200; footer links present on `/`.
- [ ] Final whole-bundle code review (subagent), fixes if needed, push to main.

## Self-Review

- Spec coverage: confirm route (§1)→A; reset flow (§2)→B,C; confirm-email readiness (§3)→B; legal (§4)→D; Sentry (§5)→E; verification→A,F. ✅
- No placeholders in implementation steps (legal `[PLATZHALTER]`s are product content by design). ✅
- Type consistency: `createClient` (server) awaited in route; browser client in pages; `EmailOtpType` import for verifyOtp. ✅
