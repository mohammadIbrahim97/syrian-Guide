import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the modules the route imports (no real DB / Stripe / session in tests)
vi.mock('@/lib/prisma', () => ({
  prisma: {
    guide: { findUnique: vi.fn() },
    booking: { create: vi.fn() },
  },
}))
vi.mock('@/lib/stripe', () => ({
  stripe: { checkout: { sessions: { create: vi.fn() } } },
}))
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

import { POST } from '@/app/api/checkout/route'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { auth } from '@/lib/auth'

const mockedAuth = vi.mocked(auth)
const mockedFindGuide = vi.mocked(prisma.guide.findUnique)
const mockedCreateBooking = vi.mocked(prisma.booking.create)
const mockedStripeCreate = vi.mocked(stripe.checkout.sessions.create)

const studentGuide = {
  id: 'guide_student',
  guideType: 'STUDENT',
  hourlyRate: 10,
  packagePrice: null,
  maxGroupSize: 1,
  user: { name: 'Ahmad' },
}

const professionalGuide = {
  id: 'guide_pro',
  guideType: 'PROFESSIONAL',
  hourlyRate: null,
  packagePrice: 25,
  maxGroupSize: 4,
  user: { name: 'Layla' },
}

function checkoutRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedAuth.mockResolvedValue({ user: { id: 'user_1' } } as never)
  mockedStripeCreate.mockResolvedValue({ id: 'cs_test_1', url: 'https://stripe.test/pay' } as never)
  mockedCreateBooking.mockResolvedValue({} as never)
})

describe('POST /api/checkout (guide-centric booking)', () => {
  it('returns 401 when not logged in', async () => {
    mockedAuth.mockResolvedValue(null as never)
    const res = await POST(checkoutRequest({ guideId: 'g', date: '2026-08-01', durationHours: 2 }) as never)
    expect(res.status).toBe(401)
  })

  it('returns 404 when the guide does not exist', async () => {
    mockedFindGuide.mockResolvedValue(null as never)
    const res = await POST(checkoutRequest({ guideId: 'nope', date: '2026-08-01', durationHours: 2 }) as never)
    expect(res.status).toBe(404)
  })

  it('books a student guide hourly: totalPrice = hourlyRate × hours + 10% fee', async () => {
    mockedFindGuide.mockResolvedValue(studentGuide as never)

    const res = await POST(checkoutRequest({ guideId: 'guide_student', date: '2026-08-01', durationHours: 3 }) as never)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.url).toBe('https://stripe.test/pay')

    // Stripe: 3h × €10 = €30 (3000 cents) + €3 fee (300 cents)
    const stripeArgs = mockedStripeCreate.mock.calls[0][0] as never as {
      line_items: { price_data: { unit_amount: number } }[]
    }
    expect(stripeArgs.line_items[0].price_data.unit_amount).toBe(3000)
    expect(stripeArgs.line_items[1].price_data.unit_amount).toBe(300)

    // Booking: PENDING, tied to the guide, hourly
    expect(mockedCreateBooking).toHaveBeenCalledWith({
      data: expect.objectContaining({
        guideId: 'guide_student',
        userId: 'user_1',
        durationHours: 3,
        totalPrice: 33,
        status: 'PENDING',
        stripeSessionId: 'cs_test_1',
      }),
    })
  })

  it('rejects a student booking without durationHours', async () => {
    mockedFindGuide.mockResolvedValue(studentGuide as never)
    const res = await POST(checkoutRequest({ guideId: 'guide_student', date: '2026-08-01' }) as never)
    expect(res.status).toBe(400)
    expect(mockedStripeCreate).not.toHaveBeenCalled()
  })

  it('books a professional guide as a package: totalPrice = packagePrice × participants + 10% fee', async () => {
    mockedFindGuide.mockResolvedValue(professionalGuide as never)

    const res = await POST(checkoutRequest({ guideId: 'guide_pro', date: '2026-08-01', participants: 2 }) as never)
    expect(res.status).toBe(200)

    // Stripe: 2 × €25 = €50 (5000 cents) + €5 fee (500 cents)
    const stripeArgs = mockedStripeCreate.mock.calls[0][0] as never as {
      line_items: { price_data: { unit_amount: number } }[]
    }
    expect(stripeArgs.line_items[0].price_data.unit_amount).toBe(5000)
    expect(stripeArgs.line_items[1].price_data.unit_amount).toBe(500)

    expect(mockedCreateBooking).toHaveBeenCalledWith({
      data: expect.objectContaining({
        guideId: 'guide_pro',
        participants: 2,
        totalPrice: 55,
        status: 'PENDING',
      }),
    })
  })

  it('rejects a package booking above maxGroupSize', async () => {
    mockedFindGuide.mockResolvedValue(professionalGuide as never)
    const res = await POST(checkoutRequest({ guideId: 'guide_pro', date: '2026-08-01', participants: 5 }) as never)
    expect(res.status).toBe(400)
    expect(mockedStripeCreate).not.toHaveBeenCalled()
  })

  it('rejects a professional booking without participants', async () => {
    mockedFindGuide.mockResolvedValue(professionalGuide as never)
    const res = await POST(checkoutRequest({ guideId: 'guide_pro', date: '2026-08-01' }) as never)
    expect(res.status).toBe(400)
  })

  it('rejects missing guideId or date', async () => {
    const res = await POST(checkoutRequest({ date: '2026-08-01' }) as never)
    expect(res.status).toBe(400)
    const res2 = await POST(checkoutRequest({ guideId: 'g' }) as never)
    expect(res2.status).toBe(400)
  })
})
