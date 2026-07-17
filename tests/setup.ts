import { beforeEach } from 'vitest'
import { resetRateLimit } from '@/lib/rate-limit'

// The rate limiter keeps request counts in module memory. Clear it before every
// test so counts from one test never carry into another.
beforeEach(() => {
  resetRateLimit()
})
