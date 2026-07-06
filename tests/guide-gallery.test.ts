import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUpload = vi.fn()
const mockRemove = vi.fn()
const mockGetPublicUrl = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    guide: { findUnique: vi.fn() },
    guidePhoto: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
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

import { POST, DELETE } from '@/app/api/guides/gallery/route'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { NextRequest } from 'next/server'

const mockedGetUser = vi.mocked(getUser)
const mockedFindGuide = vi.mocked(prisma.guide.findUnique)
const mockedCount = vi.mocked(prisma.guidePhoto.count)
const mockedCreate = vi.mocked(prisma.guidePhoto.create)
const mockedFindFirst = vi.mocked(prisma.guidePhoto.findFirst)
const mockedDelete = vi.mocked(prisma.guidePhoto.delete)

const PHOTO_URL = 'https://x.supabase.co/storage/v1/object/public/gallery/user_1/abc.png'

function fileOf(type: string, bytes = 1024) {
  return new File([new Uint8Array(bytes)], 'a', { type })
}
function postWith(file?: File) {
  const fd = new FormData()
  if (file) fd.set('file', file)
  return new Request('http://localhost/api/guides/gallery', { method: 'POST', body: fd })
}
function deleteWith(id?: string) {
  const qs = id ? `?id=${encodeURIComponent(id)}` : ''
  return new NextRequest(`http://localhost/api/guides/gallery${qs}`, { method: 'DELETE' })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetUser.mockResolvedValue({ id: 'user_1' } as never)
  mockedFindGuide.mockResolvedValue({ id: 'guide_1', userId: 'user_1' } as never)
  mockedCount.mockResolvedValue(0)
  mockedCreate.mockImplementation(
    (async (args: { data: { guideId: string; url: string } }) =>
      ({ id: 'photo_1', ...args.data })) as never
  )
  mockedFindFirst.mockResolvedValue({ id: 'photo_1', guideId: 'guide_1', url: PHOTO_URL } as never)
  mockedDelete.mockResolvedValue({} as never)
  mockUpload.mockResolvedValue({ error: null })
  mockRemove.mockResolvedValue({ error: null })
  mockGetPublicUrl.mockImplementation((path: string) => ({
    data: { publicUrl: `https://x.supabase.co/storage/v1/object/public/gallery/${path}` },
  }))
})

describe('POST /api/guides/gallery', () => {
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

  it('returns 413 for a file over 5 MB', async () => {
    const res = await POST(postWith(fileOf('image/png', 6 * 1024 * 1024)) as never)
    expect(res.status).toBe(413)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('rejects the 11th photo with a clear message', async () => {
    mockedCount.mockResolvedValue(10)
    const res = await POST(postWith(fileOf('image/png')) as never)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('up to 10 photos')
    expect(mockUpload).not.toHaveBeenCalled()
    expect(mockedCreate).not.toHaveBeenCalled()
  })

  it('still accepts the 10th photo', async () => {
    mockedCount.mockResolvedValue(9)
    const res = await POST(postWith(fileOf('image/png')) as never)
    expect(res.status).toBe(200)
  })

  it('uploads to a unique path under the user and stores a GuidePhoto row', async () => {
    const res = await POST(postWith(fileOf('image/png')) as never)
    expect(res.status).toBe(200)
    const data = await res.json()

    const [path, , opts] = mockUpload.mock.calls[0]
    expect(path).toMatch(/^user_1\/[0-9a-f-]{36}\.png$/)
    expect(opts).toEqual(expect.objectContaining({ contentType: 'image/png' }))
    expect(opts?.upsert).toBeUndefined()

    const createArg = mockedCreate.mock.calls[0][0]
    expect(createArg.data).toEqual({
      guideId: 'guide_1',
      url: `https://x.supabase.co/storage/v1/object/public/gallery/${path}`,
    })
    expect(data.id).toBe('photo_1')
    expect(data.url).toContain(`gallery/${path}`)
  })

  it('returns 500 when the storage upload fails', async () => {
    mockUpload.mockResolvedValue({ error: { message: 'boom' } })
    const res = await POST(postWith(fileOf('image/png')) as never)
    expect(res.status).toBe(500)
    expect(mockedCreate).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/guides/gallery', () => {
  it('returns 401 when not logged in', async () => {
    mockedGetUser.mockResolvedValue(null as never)
    const res = await DELETE(deleteWith('photo_1'))
    expect(res.status).toBe(401)
    expect(mockedDelete).not.toHaveBeenCalled()
  })

  it('returns 400 when no photo id is given', async () => {
    const res = await DELETE(deleteWith())
    expect(res.status).toBe(400)
    expect(mockedDelete).not.toHaveBeenCalled()
  })

  it("returns 404 for another guide's photo (scoped lookup)", async () => {
    mockedFindFirst.mockResolvedValue(null as never)
    const res = await DELETE(deleteWith('photo_of_someone_else'))
    expect(res.status).toBe(404)
    expect(mockedFindFirst).toHaveBeenCalledWith({
      where: { id: 'photo_of_someone_else', guideId: 'guide_1' },
    })
    expect(mockedDelete).not.toHaveBeenCalled()
    expect(mockRemove).not.toHaveBeenCalled()
  })

  it('deletes the row and removes the storage object', async () => {
    const res = await DELETE(deleteWith('photo_1'))
    expect(res.status).toBe(200)
    expect(mockedDelete).toHaveBeenCalledWith({ where: { id: 'photo_1' } })
    expect(mockRemove).toHaveBeenCalledWith(['user_1/abc.png'])
  })
})
