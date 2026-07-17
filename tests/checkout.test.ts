import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the modules the route imports (no real DB / Stripe / session in tests)
vi.mock('@/lib/prisma', () => ({
  prisma: {
    availabilitySlot: { findUnique: vi.fn(), updateMany: vi.fn() },
    booking: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('@/lib/stripe', () => ({
  stripe: { checkout: { sessions: { create: vi.fn() } } },
}))
vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
}))

import { POST } from '@/app/api/checkout/route'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { getUser } from '@/lib/auth'

const mockedGetUser = vi.mocked(getUser)
const mockedFindSlot = vi.mocked(prisma.availabilitySlot.findUnique)
const mockedClaimSlot = vi.mocked(prisma.availabilitySlot.updateMany)
const mockedCreateBooking = vi.mocked(prisma.booking.create)
const mockedTransaction = vi.mocked(prisma.$transaction)
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

// A free 4-hour slot in the future (09:00–13:00)
function freeSlot(guide: typeof studentGuide | typeof professionalGuide) {
  return {
    id: 'slot_1',
    guideId: guide.id,
    date: new Date('2099-08-01T00:00:00.000Z'),
    startTime: '09:00',
    endTime: '13:00',
    isBooked: false,
    guide,
  }
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
  mockedGetUser.mockResolvedValue({ id: 'user_1' } as never)
  mockedStripeCreate.mockResolvedValue({ id: 'cs_test_1', url: 'https://stripe.test/pay' } as never)
  mockedCreateBooking.mockResolvedValue({} as never)
  // The slot claim succeeds by default (one row updated)
  mockedClaimSlot.mockResolvedValue({ count: 1 } as never)
  // Run the transaction callback against the mocked prisma client
  mockedTransaction.mockImplementation(((cb: (tx: typeof prisma) => unknown) => cb(prisma)) as never)
})

describe('POST /api/checkout (slot-consuming booking)', () => {
  it('returns 401 when not logged in', async () => {
    mockedGetUser.mockResolvedValue(null as never)
    const res = await POST(checkoutRequest({ guideId: 'g', slotId: 's', durationHours: 2 }) as never)
    expect(res.status).toBe(401)
  })

  it('returns 400 when guideId or slotId is missing', async () => {
    const res = await POST(checkoutRequest({ slotId: 's', durationHours: 2 }) as never)
    expect(res.status).toBe(400)
    const res2 = await POST(checkoutRequest({ guideId: 'g', durationHours: 2 }) as never)
    expect(res2.status).toBe(400)
  })

  it('returns 404 when the slot does not exist', async () => {
    mockedFindSlot.mockResolvedValue(null as never)
    const res = await POST(checkoutRequest({ guideId: 'g', slotId: 'nope', durationHours: 2 }) as never)
    expect(res.status).toBe(404)
  })

  it("returns 400 when the slot belongs to a different guide", async () => {
    mockedFindSlot.mockResolvedValue(freeSlot(studentGuide) as never)
    const res = await POST(checkoutRequest({ guideId: 'other_guide', slotId: 'slot_1', durationHours: 2 }) as never)
    expect(res.status).toBe(400)
    expect(mockedStripeCreate).not.toHaveBeenCalled()
  })

  it('returns 409 when the slot is already booked', async () => {
    mockedFindSlot.mockResolvedValue({ ...freeSlot(studentGuide), isBooked: true } as never)
    const res = await POST(checkoutRequest({ guideId: 'guide_student', slotId: 'slot_1', durationHours: 2 }) as never)
    expect(res.status).toBe(409)
    expect(mockedStripeCreate).not.toHaveBeenCalled()
  })

  it('returns 400 when the slot date is in the past', async () => {
    mockedFindSlot.mockResolvedValue({ ...freeSlot(studentGuide), date: new Date('2020-01-01T00:00:00.000Z') } as never)
    const res = await POST(checkoutRequest({ guideId: 'guide_student', slotId: 'slot_1', durationHours: 2 }) as never)
    expect(res.status).toBe(400)
    expect(mockedStripeCreate).not.toHaveBeenCalled()
  })

  it('books a student for 3h in a 4h slot: price = rate × hours + 10% fee, slot claimed, date from slot', async () => {
    mockedFindSlot.mockResolvedValue(freeSlot(studentGuide) as never)

    const res = await POST(checkoutRequest({ guideId: 'guide_student', slotId: 'slot_1', durationHours: 3 }) as never)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.url).toBe('https://stripe.test/pay')

    // Stripe: 3h × $10 = $30 (3000 cents) + $3 fee (300 cents)
    const stripeArgs = mockedStripeCreate.mock.calls[0][0] as never as {
      line_items: { price_data: { unit_amount: number } }[]
      expires_at: number
    }
    expect(stripeArgs.line_items[0].price_data.unit_amount).toBe(3000)
    expect(stripeArgs.line_items[1].price_data.unit_amount).toBe(300)

    // The session must expire (Stripe minimum 30 min) so an abandoned
    // checkout gives the claimed slot back via checkout.session.expired
    const nowSeconds = Math.floor(Date.now() / 1000)
    expect(stripeArgs.expires_at).toBeGreaterThanOrEqual(nowSeconds + 30 * 60 - 5)
    expect(stripeArgs.expires_at).toBeLessThanOrEqual(nowSeconds + 24 * 60 * 60)

    // Slot claimed atomically: compare-and-set on isBooked
    expect(mockedClaimSlot).toHaveBeenCalledWith({
      where: { id: 'slot_1', isBooked: false },
      data: { isBooked: true },
    })

    // Booking: tied to guide AND slot, date comes from the slot (server-side)
    expect(mockedCreateBooking).toHaveBeenCalledWith({
      data: expect.objectContaining({
        guideId: 'guide_student',
        slotId: 'slot_1',
        userId: 'user_1',
        date: new Date('2099-08-01T00:00:00.000Z'),
        durationHours: 3,
        totalPrice: 33,
        status: 'PENDING',
        stripeSessionId: 'cs_test_1',
      }),
    })
  })

  it('rejects a student booking longer than the slot (5h in a 4h slot)', async () => {
    mockedFindSlot.mockResolvedValue(freeSlot(studentGuide) as never)
    const res = await POST(checkoutRequest({ guideId: 'guide_student', slotId: 'slot_1', durationHours: 5 }) as never)
    expect(res.status).toBe(400)
    expect(mockedStripeCreate).not.toHaveBeenCalled()
  })

  it('rejects a student booking without durationHours', async () => {
    mockedFindSlot.mockResolvedValue(freeSlot(studentGuide) as never)
    const res = await POST(checkoutRequest({ guideId: 'guide_student', slotId: 'slot_1' }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 409 when another booking wins the race (claim updates 0 rows)', async () => {
    mockedFindSlot.mockResolvedValue(freeSlot(studentGuide) as never)
    mockedClaimSlot.mockResolvedValue({ count: 0 } as never)

    const res = await POST(checkoutRequest({ guideId: 'guide_student', slotId: 'slot_1', durationHours: 2 }) as never)
    expect(res.status).toBe(409)
    // The booking must never be created when the claim fails
    expect(mockedCreateBooking).not.toHaveBeenCalled()
  })

  it('books a professional package: price = packagePrice × participants + 10% fee', async () => {
    mockedFindSlot.mockResolvedValue(freeSlot(professionalGuide) as never)

    const res = await POST(checkoutRequest({ guideId: 'guide_pro', slotId: 'slot_1', participants: 2 }) as never)
    expect(res.status).toBe(200)

    const stripeArgs = mockedStripeCreate.mock.calls[0][0] as never as {
      line_items: { price_data: { unit_amount: number } }[]
    }
    expect(stripeArgs.line_items[0].price_data.unit_amount).toBe(5000)
    expect(stripeArgs.line_items[1].price_data.unit_amount).toBe(500)

    expect(mockedCreateBooking).toHaveBeenCalledWith({
      data: expect.objectContaining({
        guideId: 'guide_pro',
        slotId: 'slot_1',
        participants: 2,
        totalPrice: 55,
        status: 'PENDING',
      }),
    })
  })

  it('rejects a package booking above maxGroupSize', async () => {
    mockedFindSlot.mockResolvedValue(freeSlot(professionalGuide) as never)
    const res = await POST(checkoutRequest({ guideId: 'guide_pro', slotId: 'slot_1', participants: 5 }) as never)
    expect(res.status).toBe(400)
    expect(mockedStripeCreate).not.toHaveBeenCalled()
  })

  it('rejects a professional booking without participants', async () => {
    mockedFindSlot.mockResolvedValue(freeSlot(professionalGuide) as never)
    const res = await POST(checkoutRequest({ guideId: 'guide_pro', slotId: 'slot_1' }) as never)
    expect(res.status).toBe(400)
    expect(mockedStripeCreate).not.toHaveBeenCalled()
  })
})
