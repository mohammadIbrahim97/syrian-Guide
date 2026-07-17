import { NextResponse } from "next/server";

// Best-effort in-memory rate limiter.
//
// State lives in module memory, so limits are per serverless instance and are
// lost on cold start. That is enough to blunt rapid abuse loops — a tight burst
// from one client usually lands on a single warm instance — without any
// external infrastructure. It is NOT a strict global limit: under heavy fan-out
// across many instances a determined caller can exceed it. For hard guarantees
// put a shared store (Redis) or an edge WAF in front. The DB-enforced
// pending-booking cap in the checkout route is the authoritative limit that
// does not rely on this.

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

// Opportunistic cleanup ceiling: once the map grows past this many keys we drop
// expired windows so memory can't grow without bound on a long-lived instance.
// These routes are all authenticated, so the live key count is bounded by
// active users and normally stays far below this.
const MAX_KEYS = 10_000;

// Per-route limits. Keyed by kind so related routes (the three uploads) share
// one budget. Windows are short so a throttled user recovers quickly.
export const RATE_LIMITS = {
  checkout: { limit: 10, windowMs: 60_000 },
  upload: { limit: 20, windowMs: 60_000 },
  apply: { limit: 5, windowMs: 60_000 },
} as const;

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

// Count one request against `${kind}:${id}` and report whether it is allowed.
export function rateLimit(
  kind: keyof typeof RATE_LIMITS,
  id: string
): RateLimitResult {
  const { limit, windowMs } = RATE_LIMITS[kind];
  const key = `${kind}:${id}`;
  const now = Date.now();

  if (buckets.size > MAX_KEYS) {
    for (const [k, w] of buckets) {
      if (now >= w.resetAt) buckets.delete(k);
    }
  }

  const win = buckets.get(key);
  if (!win || now >= win.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (win.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((win.resetAt - now) / 1000) };
  }

  win.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}

// Standard 429 response with a Retry-After hint.
export function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again in a moment." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

// Test-only: clear all limiter state so counts don't leak between tests.
export function resetRateLimit() {
  buckets.clear();
}
