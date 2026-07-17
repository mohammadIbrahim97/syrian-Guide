import { describe, it, expect } from 'vitest'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

// tests/setup.ts resets the limiter before every test, so each case starts with
// a clean budget.
describe('rateLimit (in-memory best-effort limiter)', () => {
  it('allows up to the limit, then blocks with a positive Retry-After', () => {
    const { limit } = RATE_LIMITS.apply
    for (let i = 0; i < limit; i++) {
      expect(rateLimit('apply', 'user_a').ok).toBe(true)
    }
    const blocked = rateLimit('apply', 'user_a')
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('tracks each id independently', () => {
    const { limit } = RATE_LIMITS.apply
    for (let i = 0; i < limit; i++) rateLimit('apply', 'user_b')
    expect(rateLimit('apply', 'user_b').ok).toBe(false)
    // A different user still has a full budget.
    expect(rateLimit('apply', 'user_c').ok).toBe(true)
  })

  it('keeps a separate budget per kind for the same id', () => {
    const { limit } = RATE_LIMITS.apply
    for (let i = 0; i < limit; i++) rateLimit('apply', 'user_d')
    expect(rateLimit('apply', 'user_d').ok).toBe(false)
    // The same id under a different kind is unaffected.
    expect(rateLimit('checkout', 'user_d').ok).toBe(true)
  })
})
