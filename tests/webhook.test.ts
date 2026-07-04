import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the modules the route imports (no real DB / Stripe in tests)
vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: { updateMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    availabilitySlot: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('@/lib/stripe', () => ({
  stripe: { webhooks: { constructEvent: vi.fn() } },
}))

import { POST } from '@/app/api/webhook/route'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

const mockedConstructEvent = vi.mocked(stripe.webhooks.constructEvent)
const mockedUpdateMany = vi.mocked(prisma.booking.updateMany)

function webhookRequest(body: unknown, sig?: string) {
  return new Request('http://localhost/api/webhook', {
    method: 'POST',
    headers: sig ? { 'stripe-signature': sig } : {},
    body: JSON.stringify(body),
  })
}

function completedEvent(sessionId: string, paymentStatus = 'paid') {
  return {
    type: 'checkout.session.completed',
    data: { object: { id: sessionId, payment_status: paymentStatus } },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/webhook (signature-verified payment events)', () => {
  it('returns 500 and touches nothing when STRIPE_WEBHOOK_SECRET is not configured', async () => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '')
    const res = await POST(webhookRequest(completedEvent('cs_1'), 'sig') as never)
    expect(res.status).toBe(500)
    expect(mockedConstructEvent).not.toHaveBeenCalled()
    expect(mockedUpdateMany).not.toHaveBeenCalled()
  })

  it('rejects an unsigned payload (the old JSON.parse fallback must be gone)', async () => {
    const res = await POST(webhookRequest(completedEvent('cs_1')) as never)
    expect(res.status).toBe(400)
    expect(mockedConstructEvent).not.toHaveBeenCalled()
    expect(mockedUpdateMany).not.toHaveBeenCalled()
  })

  it('rejects a payload whose signature fails verification', async () => {
    mockedConstructEvent.mockImplementation(() => {
      throw new Error('bad signature')
    })
    const res = await POST(webhookRequest(completedEvent('cs_1'), 'bad-sig') as never)
    expect(res.status).toBe(400)
    expect(mockedUpdateMany).not.toHaveBeenCalled()
  })

  it('confirms only PENDING bookings when a verified session is paid', async () => {
    mockedConstructEvent.mockReturnValue(completedEvent('cs_paid') as never)
    mockedUpdateMany.mockResolvedValue({ count: 1 } as never)

    const res = await POST(webhookRequest(completedEvent('cs_paid'), 'good-sig') as never)
    expect(res.status).toBe(200)
    expect(mockedUpdateMany).toHaveBeenCalledWith({
      where: { stripeSessionId: 'cs_paid', status: 'PENDING' },
      data: { status: 'CONFIRMED' },
    })
  })

  it('does not confirm a completed session that is not paid', async () => {
    mockedConstructEvent.mockReturnValue(completedEvent('cs_unpaid', 'unpaid') as never)

    const res = await POST(webhookRequest(completedEvent('cs_unpaid', 'unpaid'), 'good-sig') as never)
    expect(res.status).toBe(200)
    expect(mockedUpdateMany).not.toHaveBeenCalled()
  })
})

const mockedTransaction = vi.mocked(prisma.$transaction)
const mockedFindBooking = vi.mocked(prisma.booking.findUnique)
const mockedUpdateBooking = vi.mocked(prisma.booking.update)
const mockedUpdateSlot = vi.mocked(prisma.availabilitySlot.update)

function expiredEvent(sessionId: string) {
  return {
    type: 'checkout.session.expired',
    data: { object: { id: sessionId } },
  }
}

describe('POST /api/webhook (expired checkout releases the slot)', () => {
  beforeEach(() => {
    // Run the transaction callback against the mocked prisma client
    mockedTransaction.mockImplementation((cb: never) => (cb as (tx: typeof prisma) => unknown)(prisma) as never)
  })

  it('cancels the PENDING booking and reopens its slot when the session expires', async () => {
    mockedConstructEvent.mockReturnValue(expiredEvent('cs_gone') as never)
    mockedFindBooking.mockResolvedValue({ id: 'b_1', status: 'PENDING', slotId: 'slot_1' } as never)

    const res = await POST(webhookRequest(expiredEvent('cs_gone'), 'good-sig') as never)
    expect(res.status).toBe(200)

    expect(mockedUpdateBooking).toHaveBeenCalledWith({
      where: { id: 'b_1' },
      data: { status: 'CANCELLED' },
    })
    expect(mockedUpdateSlot).toHaveBeenCalledWith({
      where: { id: 'slot_1' },
      data: { isBooked: false },
    })
  })

  it('leaves a CONFIRMED booking (and its slot) untouched when a stale expiry arrives', async () => {
    mockedConstructEvent.mockReturnValue(expiredEvent('cs_paid_then_expired') as never)
    mockedFindBooking.mockResolvedValue({ id: 'b_2', status: 'CONFIRMED', slotId: 'slot_2' } as never)

    const res = await POST(webhookRequest(expiredEvent('cs_paid_then_expired'), 'good-sig') as never)
    expect(res.status).toBe(200)

    expect(mockedUpdateBooking).not.toHaveBeenCalled()
    expect(mockedUpdateSlot).not.toHaveBeenCalled()
  })

  it('ignores an expiry for a session with no booking', async () => {
    mockedConstructEvent.mockReturnValue(expiredEvent('cs_unknown') as never)
    mockedFindBooking.mockResolvedValue(null as never)

    const res = await POST(webhookRequest(expiredEvent('cs_unknown'), 'good-sig') as never)
    expect(res.status).toBe(200)

    expect(mockedUpdateBooking).not.toHaveBeenCalled()
    expect(mockedUpdateSlot).not.toHaveBeenCalled()
  })
})
