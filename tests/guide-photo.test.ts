import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUpload = vi.fn()
const mockRemove = vi.fn()
const mockGetPublicUrl = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    guide: { findUnique: vi.fn() },
    user: { update: vi.fn() },
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

import { POST, DELETE } from '@/app/api/guides/photo/route'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

const mockedGetUser = vi.mocked(getUser)
const mockedFindGuide = vi.mocked(prisma.guide.findUnique)
const mockedUpdateUser = vi.mocked(prisma.user.update)

function fileOf(type: string, bytes = 1024) {
  return new File([new Uint8Array(bytes)], 'a', { type })
}
function postWith(file?: File) {
  const fd = new FormData()
  if (file) fd.set('file', file)
  return new Request('http://localhost/api/guides/photo', { method: 'POST', body: fd })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetUser.mockResolvedValue({ id: 'user_1' } as never)
  mockedFindGuide.mockResolvedValue({ id: 'guide_1', userId: 'user_1' } as never)
  mockedUpdateUser.mockResolvedValue({} as never)
  mockUpload.mockResolvedValue({ error: null })
  mockRemove.mockResolvedValue({ error: null })
  mockGetPublicUrl.mockReturnValue({
    data: { publicUrl: 'https://x.supabase.co/storage/v1/object/public/avatars/user_1/avatar.png' },
  })
})

describe('POST /api/guides/photo', () => {
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

  it('uploads to the deterministic path and stores the public URL', async () => {
    const res = await POST(postWith(fileOf('image/png')) as never)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.url).toContain('avatars/user_1/avatar.png')

    expect(mockUpload).toHaveBeenCalledWith(
      'user_1/avatar.png',
      expect.anything(),
      expect.objectContaining({ contentType: 'image/png', upsert: true })
    )
    const updateArg = mockedUpdateUser.mock.calls[0][0]
    expect(updateArg.where).toEqual({ id: 'user_1' })
    expect((updateArg.data as { image: string }).image).toContain('avatar.png')
  })

  it('returns 500 when the storage upload fails', async () => {
    mockUpload.mockResolvedValue({ error: { message: 'boom' } })
    const res = await POST(postWith(fileOf('image/png')) as never)
    expect(res.status).toBe(500)
    expect(mockedUpdateUser).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/guides/photo', () => {
  it('returns 401 when not logged in', async () => {
    mockedGetUser.mockResolvedValue(null as never)
    const res = await DELETE()
    expect(res.status).toBe(401)
  })

  it('clears User.image and removes the objects', async () => {
    const res = await DELETE()
    expect(res.status).toBe(200)
    expect(mockRemove).toHaveBeenCalled()
    expect(mockedUpdateUser).toHaveBeenCalledWith({ where: { id: 'user_1' }, data: { image: null } })
  })
})
