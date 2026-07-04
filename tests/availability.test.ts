import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    guide: { findUnique: vi.fn() },
    availabilitySlot: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))
vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
}))

import { POST, DELETE } from '@/app/api/availability/route'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

const mockedGetUser = vi.mocked(getUser)
const mockedFindGuide = vi.mocked(prisma.guide.findUnique)
const mockedFindSlots = vi.mocked(prisma.availabilitySlot.findMany)
const mockedCreateMany = vi.mocked(prisma.availabilitySlot.createMany)
const mockedFindSlot = vi.mocked(prisma.availabilitySlot.findUnique)
const mockedDeleteMany = vi.mocked(prisma.availabilitySlot.deleteMany)

function postRequest(slots: unknown) {
  return new Request('http://localhost/api/availability', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slots }),
  })
}

function deleteRequest(slotId: string) {
  return new Request('http://localhost/api/availability', {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slotId }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetUser.mockResolvedValue({ id: 'user_1' } as never)
  mockedFindGuide.mockResolvedValue({ id: 'guide_1', userId: 'user_1' } as never)
  mockedFindSlots.mockResolvedValue([] as never)
  mockedCreateMany.mockResolvedValue({ count: 1 } as never)
})

describe('POST /api/availability (slot creation validation)', () => {
  it('returns 401 when not logged in', async () => {
    mockedGetUser.mockResolvedValue(null as never)
    const res = await POST(postRequest([{ date: '2099-08-01', startTime: '09:00', endTime: '13:00' }]) as never)
    expect(res.status).toBe(401)
  })

  it('returns 403 when the user is not a guide', async () => {
    mockedFindGuide.mockResolvedValue(null as never)
    const res = await POST(postRequest([{ date: '2099-08-01', startTime: '09:00', endTime: '13:00' }]) as never)
    expect(res.status).toBe(403)
  })

  it('rejects malformed times', async () => {
    const res = await POST(postRequest([{ date: '2099-08-01', startTime: '9am', endTime: '13:00' }]) as never)
    expect(res.status).toBe(400)
    expect(mockedCreateMany).not.toHaveBeenCalled()
  })

  it('rejects slots where endTime is not after startTime', async () => {
    const res = await POST(postRequest([{ date: '2099-08-01', startTime: '13:00', endTime: '13:00' }]) as never)
    expect(res.status).toBe(400)
    const res2 = await POST(postRequest([{ date: '2099-08-01', startTime: '22:00', endTime: '02:00' }]) as never)
    expect(res2.status).toBe(400)
    expect(mockedCreateMany).not.toHaveBeenCalled()
  })

  it('rejects slots that overlap each other within the same request', async () => {
    const res = await POST(postRequest([
      { date: '2099-08-01', startTime: '09:00', endTime: '13:00' },
      { date: '2099-08-01', startTime: '10:00', endTime: '16:00' },
    ]) as never)
    expect(res.status).toBe(400)
    expect(mockedCreateMany).not.toHaveBeenCalled()
  })

  it('rejects a slot that overlaps an existing slot for the same guide and date', async () => {
    mockedFindSlots.mockResolvedValue([
      { date: new Date('2099-08-01T00:00:00.000Z'), startTime: '09:00', endTime: '13:00' },
    ] as never)
    const res = await POST(postRequest([{ date: '2099-08-01', startTime: '10:00', endTime: '16:00' }]) as never)
    expect(res.status).toBe(400)
    expect(mockedCreateMany).not.toHaveBeenCalled()
  })

  it('accepts non-overlapping valid slots', async () => {
    mockedFindSlots.mockResolvedValue([
      { date: new Date('2099-08-01T00:00:00.000Z'), startTime: '09:00', endTime: '11:00' },
    ] as never)
    mockedCreateMany.mockResolvedValue({ count: 2 } as never)
    const res = await POST(postRequest([
      { date: '2099-08-01', startTime: '11:00', endTime: '13:00' }, // touching is not overlapping
      { date: '2099-08-02', startTime: '09:00', endTime: '13:00' },
    ]) as never)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.created).toBe(2)
  })
})

describe('DELETE /api/availability (atomic slot deletion)', () => {
  const ownSlot = {
    id: 'slot_1',
    isBooked: false,
    guide: { userId: 'user_1' },
  }

  beforeEach(() => {
    mockedFindSlot.mockResolvedValue(ownSlot as never)
    mockedDeleteMany.mockResolvedValue({ count: 1 } as never)
  })

  it('deletes an unbooked slot with a conditional (isBooked: false) delete', async () => {
    const res = await DELETE(deleteRequest('slot_1') as never)
    expect(res.status).toBe(200)
    expect(mockedDeleteMany).toHaveBeenCalledWith({
      where: { id: 'slot_1', isBooked: false },
    })
  })

  it('returns 400 when the slot is already booked', async () => {
    mockedFindSlot.mockResolvedValue({ ...ownSlot, isBooked: true } as never)
    const res = await DELETE(deleteRequest('slot_1') as never)
    expect(res.status).toBe(400)
    expect(mockedDeleteMany).not.toHaveBeenCalled()
  })

  it('returns 400 (not 500) when a checkout claims the slot between check and delete', async () => {
    // The conditional delete matches 0 rows because isBooked flipped concurrently
    mockedDeleteMany.mockResolvedValue({ count: 0 } as never)
    const res = await DELETE(deleteRequest('slot_1') as never)
    expect(res.status).toBe(400)
  })

  it("returns 404 for a slot that does not exist or is not the guide's own", async () => {
    mockedFindSlot.mockResolvedValue(null as never)
    const res = await DELETE(deleteRequest('missing') as never)
    expect(res.status).toBe(404)
  })
})
