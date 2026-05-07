import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const { updateSessionMock } = vi.hoisted(() => ({
  updateSessionMock: vi.fn(),
}))

vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: updateSessionMock,
}))

import { proxy } from './proxy'

describe('proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects anonymous users hitting protected routes to login with next param', async () => {
    updateSessionMock.mockResolvedValue({
      supabaseResponse: NextResponse.next(),
      user: null,
    })

    const request = new NextRequest('http://localhost/dashboard')
    const response = await proxy(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost/auth/login?next=%2Fdashboard')
  })

  it('protects accountant routes for anonymous users', async () => {
    updateSessionMock.mockResolvedValue({
      supabaseResponse: NextResponse.next(),
      user: null,
    })

    const request = new NextRequest('http://localhost/contador')
    const response = await proxy(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost/auth/login?next=%2Fcontador')
  })

  it('redirects authenticated users away from auth pages', async () => {
    updateSessionMock.mockResolvedValue({
      supabaseResponse: NextResponse.next(),
      user: { id: 'user-1' },
    })

    const request = new NextRequest('http://localhost/auth/login')
    const response = await proxy(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost/dashboard')
  })

  it('returns the session-updated response for public routes', async () => {
    const nextResponse = NextResponse.next()
    nextResponse.headers.set('x-test-response', 'ok')
    updateSessionMock.mockResolvedValue({
      supabaseResponse: nextResponse,
      user: null,
    })

    const request = new NextRequest('http://localhost/privacidade')
    const response = await proxy(request)

    expect(response).toBe(nextResponse)
    expect(response.headers.get('x-test-response')).toBe('ok')
  })
})
