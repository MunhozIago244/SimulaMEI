import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  createAdminClientMock,
  consumeRateLimitMock,
  hashIpAddressMock,
  getClientIpMock,
  getUserAgentMock,
  sendAccountantLeadNotificationMock,
} = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  consumeRateLimitMock: vi.fn(),
  hashIpAddressMock: vi.fn(),
  getClientIpMock: vi.fn(),
  getUserAgentMock: vi.fn(),
  sendAccountantLeadNotificationMock: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
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

vi.mock('@/lib/resend', () => ({
  sendAccountantLeadNotification: sendAccountantLeadNotificationMock,
}))

import { POST } from './route'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/accountant-leads', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      referer: 'http://localhost/para-contadores',
    },
    body: JSON.stringify(body),
  })
}

function makeRateLimitResult(overrides = {}) {
  return {
    allowed: true,
    remaining: 4,
    resetAt: '2026-04-30T12:00:00.000Z',
    hitCount: 1,
    ...overrides,
  }
}

function makeAdminMock() {
  const upsertMock = vi.fn().mockResolvedValue({ error: null })
  const fromMock = vi.fn(() => ({
    upsert: upsertMock,
  }))

  return {
    client: { from: fromMock },
    fromMock,
    upsertMock,
  }
}

const validPayload = {
  nomeEscritorio: 'Prime Contabilidade',
  email: 'contato@prime.com.br',
  telefone: '(11) 99999-9999',
  carteiraRange: '51-150',
  ferramentaAtual: 'Planilha',
  consentimentoLgpd: true,
}

describe('/api/accountant-leads POST', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    consumeRateLimitMock.mockResolvedValue(makeRateLimitResult())
    hashIpAddressMock.mockReturnValue('hashed-ip')
    getClientIpMock.mockReturnValue('127.0.0.1')
    getUserAgentMock.mockReturnValue('Vitest')
    sendAccountantLeadNotificationMock.mockResolvedValue({ ok: true })
  })

  it('rejects invalid emails', async () => {
    const response = await POST(makeRequest({ ...validPayload, email: 'invalido' }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Informe um e-mail profissional válido.' })
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })

  it('requires LGPD consent', async () => {
    const response = await POST(makeRequest({ ...validPayload, consentimentoLgpd: false }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Aceite a política de privacidade para solicitar acesso.' })
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })

  it('returns 429 when rate limit is exhausted', async () => {
    consumeRateLimitMock.mockResolvedValueOnce(makeRateLimitResult({
      allowed: false,
      remaining: 0,
      hitCount: 5,
    }))

    const response = await POST(makeRequest(validPayload))

    expect(response.status).toBe(429)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })

  it('upserts a valid accountant lead with metadata', async () => {
    const admin = makeAdminMock()
    createAdminClientMock.mockReturnValue(admin.client)

    const response = await POST(makeRequest({
      ...validPayload,
      email: '  CONTATO@Prime.com.br ',
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(admin.fromMock).toHaveBeenCalledWith('accountant_leads')
    expect(admin.upsertMock).toHaveBeenCalledWith({
      email: 'contato@prime.com.br',
      nome_escritorio: 'Prime Contabilidade',
      telefone: '(11) 99999-9999',
      carteira_range: '51-150',
      ferramenta_atual: 'Planilha',
      origem: 'http://localhost/para-contadores',
      user_agent: 'Vitest',
      ip_hash: 'hashed-ip',
      consentimento_lgpd: true,
      consentimento_em: expect.any(String),
      status: 'novo',
    }, { onConflict: 'email' })
    expect(sendAccountantLeadNotificationMock).not.toHaveBeenCalled()
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
  })

  it('notifies immediately for 150+ client portfolio leads', async () => {
    const admin = makeAdminMock()
    createAdminClientMock.mockReturnValue(admin.client)

    const response = await POST(makeRequest({ ...validPayload, carteiraRange: '150+' }))

    expect(response.status).toBe(200)
    expect(sendAccountantLeadNotificationMock).toHaveBeenCalledWith({
      email: 'contato@prime.com.br',
      nomeEscritorio: 'Prime Contabilidade',
      telefone: '(11) 99999-9999',
      carteiraRange: '150+',
      ferramentaAtual: 'Planilha',
      origem: 'http://localhost/para-contadores',
    })
  })
})
