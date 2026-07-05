import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockedExchange = vi.fn()
const mockedVerifyOtp = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession: mockedExchange, verifyOtp: mockedVerifyOtp },
  })),
}))

import { GET } from '@/app/auth/confirm/route'

function confirmRequest(query: string) {
  return new Request(`http://localhost/auth/confirm${query}`)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedExchange.mockResolvedValue({ error: null })
  mockedVerifyOtp.mockResolvedValue({ error: null })
})

describe('GET /auth/confirm (auth email link verification)', () => {
  it('exchanges a PKCE code and redirects to next', async () => {
    const res = await GET(confirmRequest('?code=abc123&next=/reset-password') as never)
    expect(mockedExchange).toHaveBeenCalledWith('abc123')
    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.headers.get('location')).toBe('http://localhost/reset-password')
  })

  it('verifies a token_hash link and redirects to next', async () => {
    const res = await GET(confirmRequest('?token_hash=th_1&type=recovery&next=/reset-password') as never)
    expect(mockedVerifyOtp).toHaveBeenCalledWith({ type: 'recovery', token_hash: 'th_1' })
    expect(res.headers.get('location')).toBe('http://localhost/reset-password')
  })

  it('defaults next to /', async () => {
    const res = await GET(confirmRequest('?code=abc123') as never)
    expect(res.headers.get('location')).toBe('http://localhost/')
  })

  it('rejects protocol-relative next (no open redirect)', async () => {
    const res = await GET(confirmRequest('?code=abc123&next=//evil.example') as never)
    expect(res.headers.get('location')).toBe('http://localhost/')
  })

  it('rejects absolute-URL next (no open redirect)', async () => {
    const res = await GET(confirmRequest('?code=abc123&next=https://evil.example/x') as never)
    expect(res.headers.get('location')).toBe('http://localhost/')
  })

  it('rejects backslash-normalized next (open-redirect bypass)', async () => {
    const res = await GET(confirmRequest('?code=abc123&next=/%5Cevil.example') as never)
    expect(res.headers.get('location')).toBe('http://localhost/')
  })

  it('rejects tab-injected protocol-relative next (open-redirect bypass)', async () => {
    const res = await GET(confirmRequest('?code=abc123&next=/%09//evil.example') as never)
    expect(res.headers.get('location')).toBe('http://localhost/')
  })

  it('redirects to login?error=link-expired when the code exchange fails', async () => {
    mockedExchange.mockResolvedValue({ error: { message: 'expired' } })
    const res = await GET(confirmRequest('?code=bad') as never)
    expect(res.headers.get('location')).toBe('http://localhost/login?error=link-expired')
  })

  it('redirects to login?error=link-expired when verifyOtp fails', async () => {
    mockedVerifyOtp.mockResolvedValue({ error: { message: 'expired' } })
    const res = await GET(confirmRequest('?token_hash=bad&type=recovery') as never)
    expect(res.headers.get('location')).toBe('http://localhost/login?error=link-expired')
  })

  it('redirects to login?error=link-expired with no usable params', async () => {
    const res = await GET(confirmRequest('') as never)
    expect(mockedExchange).not.toHaveBeenCalled()
    expect(mockedVerifyOtp).not.toHaveBeenCalled()
    expect(res.headers.get('location')).toBe('http://localhost/login?error=link-expired')
  })
})
