import type { NextRequest } from 'next/server'

export function getClientIp(request: Pick<NextRequest, 'headers'>): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const candidate = forwardedFor?.split(',')[0]?.trim() || realIp?.trim()

  if (candidate) return candidate
  if (process.env.NODE_ENV !== 'production') return '127.0.0.1'

  return 'unknown'
}

export function getUserAgent(request: Pick<NextRequest, 'headers'>): string | null {
  const value = request.headers.get('user-agent')?.trim()
  if (!value) return null

  return value.slice(0, 512)
}
