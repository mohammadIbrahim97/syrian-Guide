import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    guide: { findUnique: vi.fn(), create: vi.fn() },
    user: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
}))

import { POST } from '@/app/api/guides/apply/route'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

const mockedGetUser = vi.mocked(getUser)
const mockedFindGuide = vi.mocked(prisma.guide.findUnique)
const mockedCreateGuide = vi.mocked(prisma.guide.create)
const mockedUpdateUser = vi.mocked(prisma.user.update)
const mockedTransaction = vi.mocked(prisma.$transaction)

const studentOffer = {
  guideType: 'STUDENT',
  bio: 'History student who loves the old city.',
  city: 'Damascus',
  languages: ['Arabic', 'English'],
  university: 'Damascus University',
  hourlyRate: 12,
  maxGroupSize: 3,
}

const professionalOffer = {
  guideType: 'PROFESSIONAL',
  bio: 'Licensed guide with a signature Aleppo package.',
  city: 'Aleppo',
  languages: ['Arabic', 'French'],
  packagePrice: 40,
  packageDuration: 240,
  maxGroupSize: 6,
}

function applyRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/guides/apply', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetUser.mockResolvedValue({ id: 'user_1' } as never)
  mockedFindGuide.mockResolvedValue(null as never)
  mockedCreateGuide.mockResolvedValue({ id: 'guide_new' } as never)
  mockedUpdateUser.mockResolvedValue({} as never)
  // Run the transaction callback against the mocked prisma client
  mockedTransaction.mockImplementation(((cb: (tx: typeof prisma) => unknown) => cb(prisma)) as never)
})

describe('POST /api/guides/apply (become a guide)', () => {
  it('returns 401 when not logged in', async () => {
    mockedGetUser.mockResolvedValue(null as never)
    const res = await POST(applyRequest(studentOffer) as never)
    expect(res.status).toBe(401)
    expect(mockedCreateGuide).not.toHaveBeenCalled()
  })

  it('returns 409 when the user already has a guide profile', async () => {
    mockedFindGuide.mockResolvedValue({ id: 'existing' } as never)
    const res = await POST(applyRequest(studentOffer) as never)
    expect(res.status).toBe(409)
    expect(mockedCreateGuide).not.toHaveBeenCalled()
  })

  it('rejects missing bio, city, or languages', async () => {
    const res = await POST(applyRequest({ ...studentOffer, bio: '' }) as never)
    expect(res.status).toBe(400)
    const res2 = await POST(applyRequest({ ...studentOffer, city: '' }) as never)
    expect(res2.status).toBe(400)
    const res3 = await POST(applyRequest({ ...studentOffer, languages: [] }) as never)
    expect(res3.status).toBe(400)
  })

  it('rejects an unknown guide type', async () => {
    const res = await POST(applyRequest({ ...studentOffer, guideType: 'ROBOT' }) as never)
    expect(res.status).toBe(400)
  })

  it('rejects a student offer without an hourly rate', async () => {
    const { hourlyRate, ...noRate } = studentOffer
    void hourlyRate
    const res = await POST(applyRequest(noRate) as never)
    expect(res.status).toBe(400)
    expect(mockedCreateGuide).not.toHaveBeenCalled()
  })

  it('rejects a professional offer without a package price', async () => {
    const { packagePrice, ...noPrice } = professionalOffer
    void packagePrice
    const res = await POST(applyRequest(noPrice) as never)
    expect(res.status).toBe(400)
    expect(mockedCreateGuide).not.toHaveBeenCalled()
  })

  it('creates a student offer, sets role GUIDE and isVerified false, returns the guide id', async () => {
    const res = await POST(applyRequest(studentOffer) as never)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe('guide_new')

    expect(mockedCreateGuide).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user_1',
        guideType: 'STUDENT',
        bio: studentOffer.bio,
        city: 'Damascus',
        languages: ['Arabic', 'English'],
        university: 'Damascus University',
        hourlyRate: 12,
        maxGroupSize: 3,
        isVerified: false,
      }),
    })
    // package fields are not set for a student
    const createArg = mockedCreateGuide.mock.calls[0][0].data as Record<string, unknown>
    expect(createArg.packagePrice).toBeUndefined()

    expect(mockedUpdateUser).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: { role: 'GUIDE' },
    })
  })

  it('creates a professional offer with package price and duration', async () => {
    const res = await POST(applyRequest(professionalOffer) as never)
    expect(res.status).toBe(201)

    expect(mockedCreateGuide).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user_1',
        guideType: 'PROFESSIONAL',
        packagePrice: 40,
        packageDuration: 240,
        maxGroupSize: 6,
        isVerified: false,
      }),
    })
    const createArg = mockedCreateGuide.mock.calls[0][0].data as Record<string, unknown>
    expect(createArg.hourlyRate).toBeUndefined()
  })
})
