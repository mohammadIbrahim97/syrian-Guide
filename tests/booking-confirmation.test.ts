import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: { updateMany: vi.fn(), findUnique: vi.fn() },
  },
}))
vi.mock('@/lib/stripe', () => ({
  stripe: { checkout: { sessions: { retrieve: vi.fn() } } },
}))

import { getVerifiedBooking } from '@/lib/booking-confirmation'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

const mockedRetrieve = vi.mocked(stripe.checkout.sessions.retrieve)
const mockedUpdateMany = vi.mocked(prisma.booking.updateMany)
const mockedFindUnique = vi.mocked(prisma.booking.findUnique)

const pendingBooking = { id: 'b_1', status: 'PENDING', guide: { user: { name: 'Ahmad' } } }

beforeEach(() => {
  vi.clearAllMocks()
  mockedFindUnique.mockResolvedValue(pendingBooking as never)
})

describe('getVerifiedBooking (success page confirmation)', () => {
  it('confirms the booking when Stripe reports the session as paid', async () => {
    mockedRetrieve.mockResolvedValue({ id: 'cs_1', payment_status: 'paid' } as never)

    await getVerifiedBooking('cs_1')

    expect(mockedRetrieve).toHaveBeenCalledWith('cs_1')
    expect(mockedUpdateMany).toHaveBeenCalledWith({
      where: { stripeSessionId: 'cs_1', status: 'PENDING' },
      data: { status: 'CONFIRMED' },
    })
  })

  it('does NOT confirm when the session is unpaid — visiting the URL is not proof of payment', async () => {
    mockedRetrieve.mockResolvedValue({ id: 'cs_1', payment_status: 'unpaid' } as never)

    const booking = await getVerifiedBooking('cs_1')

    expect(mockedUpdateMany).not.toHaveBeenCalled()
    // The booking is still returned so the page can show its pending state
    expect(booking).toEqual(pendingBooking)
  })

  it('does NOT confirm when the session id is unknown to Stripe', async () => {
    mockedRetrieve.mockRejectedValue(new Error('No such checkout.session'))

    await getVerifiedBooking('cs_forged')

    expect(mockedUpdateMany).not.toHaveBeenCalled()
  })
})
