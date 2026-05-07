import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  createClientMock,
  normalizeCnaeCodeMock,
  consumeRateLimitMock,
  hashIpAddressMock,
  getClientIpMock,
  getUserAgentMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  normalizeCnaeCodeMock: vi.fn(),
  consumeRateLimitMock: vi.fn(),
  hashIpAddressMock: vi.fn(),
  getClientIpMock: vi.fn(),
  getUserAgentMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/tributario', () => ({
  normalizeCnaeCode: normalizeCnaeCodeMock,
}))

vi.mock('@/lib/security/rate-limit', async () => {
  const actual = await vi.importActual<typeof import('@/lib/security/rate-limit')>('@/lib/security/rate-limit')
  return {
    ...actual,
    consumeRateLimit: consumeRateLimitMock,
  }
})

vi.mock('@/lib/security/hash', () => ({
  hashIpAddress: hashIpAddressMock,
}))

vi.mock('@/lib/security/request', () => ({
  getClientIp: getClientIpMock,
  getUserAgent: getUserAgentMock,
}))

import { POST } from './route'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/leads', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      referer: 'http://localhost/#simulador',
    },
    body: JSON.stringify(body),
  })
}

function makeRateLimitResult(overrides: Partial<Awaited<ReturnType<typeof consumeRateLimitMock>>> = {}) {
  return {
    allowed: true,
    remaining: 7,
    resetAt: '2026-04-30T12:00:00.000Z',
    hitCount: 1,
    ...overrides,
  }
}

function makeSupabaseMock() {
  const upsertMock = vi.fn().mockResolvedValue({ error: null })
  const fromMock = vi.fn(() => ({
    upsert: upsertMock,
  }))

  return {
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
      from: fromMock,
    },
    upsertMock,
    fromMock,
  }
}

describe('/api/leads POST', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    consumeRateLimitMock.mockResolvedValue(makeRateLimitResult())
    hashIpAddressMock.mockReturnValue('hashed-ip')
    getClientIpMock.mockReturnValue('127.0.0.1')
    getUserAgentMock.mockReturnValue('Vitest')
    normalizeCnaeCodeMock.mockImplementation((value: string) => value)
  })

  it('rejects invalid emails with 400', async () => {
    const response = await POST(makeRequest({ email: 'invalido', consentimentoLgpd: true }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'E-mail inválido.' })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('requires LGPD consent before accepting the lead', async () => {
    const response = await POST(makeRequest({ email: 'ana@example.com', consentimentoLgpd: false }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Você precisa aceitar a política de privacidade para liberar a análise completa.',
    })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('returns 429 when the lead rate limit is exhausted', async () => {
    consumeRateLimitMock.mockResolvedValueOnce(makeRateLimitResult({
      allowed: false,
      remaining: 0,
      hitCount: 8,
    }))

    const response = await POST(makeRequest({ email: 'ana@example.com', consentimentoLgpd: true }))

    expect(response.status).toBe(429)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('8')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('normalizes and upserts valid leads with user and request metadata', async () => {
    const supabase = makeSupabaseMock()
    createClientMock.mockResolvedValue(supabase.client)
    normalizeCnaeCodeMock.mockReturnValueOnce('6204-0/00')

    const response = await POST(makeRequest({
      email: '  ANA@Example.com ',
      consentimentoLgpd: true,
      tipo: 'contador_waitlist',
      faturamentoAnual: 120000,
      cnae: '6204000',
      mesAtual: 6,
      anexoAtual: 'III',
      alertaCenario: 'excesso_leve',
      taxRuleVersion: 'TEST',
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(supabase.fromMock).toHaveBeenCalledWith('leads')
    expect(supabase.upsertMock).toHaveBeenCalledWith({
      email: 'ana@example.com',
      tipo: 'contador_waitlist',
      faturamento_anual: 120000,
      cnae: '6204-0/00',
      mes_atual: 6,
      anexo_atual: 'III',
      alerta_cenario: 'excesso_leve',
      tax_rule_version: 'TEST',
      origem: 'http://localhost/#simulador',
      user_agent: 'Vitest',
      ip_hash: 'hashed-ip',
      user_id: 'user-1',
      consentimento_lgpd: true,
      consentimento_em: expect.any(String),
    }, { onConflict: 'email,tipo' })
    expect(response.headers.get('X-RateLimit-Limit')).toBe('8')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('7')
  })
})
