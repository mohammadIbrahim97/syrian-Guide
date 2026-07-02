import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    guide: { findMany: vi.fn() },
  },
}))

import { GET } from '@/app/api/guides/route'
import { prisma } from '@/lib/prisma'

const mockedFindMany = vi.mocked(prisma.guide.findMany)

function searchRequest(query: string) {
  return new Request(`http://localhost/api/guides${query}`)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedFindMany.mockResolvedValue([] as never)
})

describe('GET /api/guides (guide search)', () => {
  it('returns guides from the database', async () => {
    mockedFindMany.mockResolvedValue([{ id: 'g1' }, { id: 'g2' }] as never)
    const res = await GET(searchRequest('') as never)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.guides).toHaveLength(2)
    expect(data.count).toBe(2)
  })

  it('filters maxPrice against hourlyRate OR packagePrice', async () => {
    await GET(searchRequest('?maxPrice=20') as never)
    const where = mockedFindMany.mock.calls[0][0]?.where as { AND: unknown[] }
    expect(where.AND).toContainEqual({
      OR: [{ hourlyRate: { lte: 20 } }, { packagePrice: { lte: 20 } }],
    })
  })

  it('filters languages with hasEvery', async () => {
    await GET(searchRequest('?lang=English&lang=Arabic') as never)
    const where = mockedFindMany.mock.calls[0][0]?.where as { AND: unknown[] }
    expect(where.AND).toContainEqual({ languages: { hasEvery: ['English', 'Arabic'] } })
  })
})
