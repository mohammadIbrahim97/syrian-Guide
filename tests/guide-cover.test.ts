import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUpload = vi.fn()
const mockRemove = vi.fn()
const mockGetPublicUrl = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    guide: { findUnique: vi.fn(), update: vi.fn() },
  },
}))
vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    storage: {
      from: () => ({ upload: mockUpload, remove: mockRemove, getPublicUrl: mockGetPublicUrl }),
    },
  }),
}))

import { POST, DELETE } from '@/app/api/guides/cover/route'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

const mockedGetUser = vi.mocked(getUser)
const mockedFindGuide = vi.mocked(prisma.guide.findUnique)
const mockedUpdateGuide = vi.mocked(prisma.guide.update)

function fileOf(type: string, bytes = 1024) {
  return new File([new Uint8Array(bytes)], 'a', { type })
}
function postWith(file?: File) {
  const fd = new FormData()
  if (file) fd.set('file', file)
  return new Request('http://localhost/api/guides/cover', { method: 'POST', body: fd })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetUser.mockResolvedValue({ id: 'user_1' } as never)
  mockedFindGuide.mockResolvedValue({ id: 'guide_1', userId: 'user_1' } as never)
  mockedUpdateGuide.mockResolvedValue({} as never)
  mockUpload.mockResolvedValue({ error: null })
  mockRemove.mockResolvedValue({ error: null })
  mockGetPublicUrl.mockReturnValue({
    data: { publicUrl: 'https://x.supabase.co/storage/v1/object/public/covers/user_1/cover.png' },
  })
})

describe('POST /api/guides/cover', () => {
  it('returns 401 when not logged in', async () => {
    mockedGetUser.mockResolvedValue(null as never)
    const res = await POST(postWith(fileOf('image/png')) as never)
    expect(res.status).toBe(401)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('returns 403 when the user is not a guide', async () => {
    mockedFindGuide.mockResolvedValue(null as never)
    const res = await POST(postWith(fileOf('image/png')) as never)
    expect(res.status).toBe(403)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('returns 400 when no file is provided', async () => {
    const res = await POST(postWith() as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 for an unsupported image type', async () => {
    const res = await POST(postWith(fileOf('image/gif')) as never)
    expect(res.status).toBe(400)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('returns 413 for a file over 7 MB', async () => {
    const res = await POST(postWith(fileOf('image/png', 8 * 1024 * 1024)) as never)
    expect(res.status).toBe(413)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('uploads to the deterministic path and stores the cover URL on the guide', async () => {
    const res = await POST(postWith(fileOf('image/png')) as never)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.url).toContain('covers/user_1/cover.png')

    expect(mockUpload).toHaveBeenCalledWith(
      'user_1/cover.png',
      expect.anything(),
      expect.objectContaining({ contentType: 'image/png', upsert: true })
    )
    const updateArg = mockedUpdateGuide.mock.calls[0][0]
    expect(updateArg.where).toEqual({ id: 'guide_1' })
    expect((updateArg.data as { coverImage: string }).coverImage).toContain('cover.png')
  })

  it('returns 500 when the storage upload fails', async () => {
    mockUpload.mockResolvedValue({ error: { message: 'boom' } })
    const res = await POST(postWith(fileOf('image/png')) as never)
    expect(res.status).toBe(500)
    expect(mockedUpdateGuide).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/guides/cover', () => {
  it('returns 401 when not logged in', async () => {
    mockedGetUser.mockResolvedValue(null as never)
    const res = await DELETE()
    expect(res.status).toBe(401)
  })

  it('clears Guide.coverImage and removes the objects', async () => {
    const res = await DELETE()
    expect(res.status).toBe(200)
    expect(mockRemove).toHaveBeenCalled()
    expect(mockedUpdateGuide).toHaveBeenCalledWith({ where: { id: 'guide_1' }, data: { coverImage: null } })
  })
})
