import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  createClientMock,
  getCnaeMock,
  normalizeCnaeCodeMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getCnaeMock: vi.fn(),
  normalizeCnaeCodeMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/tributario', async () => {
  const actual = await vi.importActual<typeof import('@/lib/tributario')>('@/lib/tributario')
  return {
    ...actual,
    getCnae: getCnaeMock,
    normalizeCnaeCode: normalizeCnaeCodeMock,
  }
})

import { POST } from './route'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/monthly-inputs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeSupabaseMock(options?: {
  user?: { id: string; email?: string } | null
  history?: Array<Record<string, unknown>>
}) {
  const user = options && 'user' in options ? options.user : { id: 'user-1', email: 'ana@example.com' }
  const history = options?.history ?? [
    { ano: 2026, mes: 1, faturamento_mes: 10_000, folha_mes: 4_000, anexo_calculado: 'V', fator_r: 0.24 },
    { ano: 2026, mes: 2, faturamento_mes: 12_000, folha_mes: 4_000, anexo_calculado: 'V', fator_r: 0.26 },
  ]

  const upsertMock = vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn().mockResolvedValue({
        data: { id: 'row-1' },
        error: null,
      }),
    })),
  }))

  const selectChain = {
    eq: vi.fn(() => ({
      order: vi.fn().mockResolvedValue({
        data: history,
        error: null,
      }),
    })),
  }

  const fromMock = vi.fn((table: string) => {
    if (table === 'monthly_inputs') {
      return {
        select: vi.fn(() => selectChain),
        upsert: upsertMock,
      }
    }

    throw new Error(`Unexpected table: ${table}`)
  })

  return {
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user } }),
      },
      from: fromMock,
    },
    upsertMock,
  }
}

describe('/api/monthly-inputs POST', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    normalizeCnaeCodeMock.mockImplementation((value: string) => value)
    getCnaeMock.mockReturnValue({
      cnae: '6201-5/01',
      descricao: 'Desenvolvimento de programas',
      anexoPadrao: 'V',
      elegivelFatorR: true,
      categoria: 'ti_consultoria',
      classificacaoTributaria: 'curada',
    })
  })

  it('requires authentication', async () => {
    createClientMock.mockResolvedValue(makeSupabaseMock({ user: null }).client)

    const response = await POST(makeRequest({
      ano: 2026,
      mes: 3,
      faturamentoMes: 13_000,
      folhaMes: 2_500,
      cnae: '6201-5/01',
      tipoMei: 'geral',
    }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Autenticação obrigatória.' })
  })

  it('rejects unknown CNAE codes', async () => {
    createClientMock.mockResolvedValue(makeSupabaseMock().client)
    getCnaeMock.mockReturnValueOnce(undefined)

    const response = await POST(makeRequest({
      ano: 2026,
      mes: 3,
      faturamentoMes: 13_000,
      folhaMes: 2_500,
      cnae: '9999-9/99',
      tipoMei: 'geral',
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'CNAE não reconhecido. Informe um código oficial válido.',
    })
  })

  it('stores the monthly input with derived monitor fields', async () => {
    const supabase = makeSupabaseMock()
    createClientMock.mockResolvedValue(supabase.client)

    const response = await POST(makeRequest({
      ano: 2026,
      mes: 3,
      faturamentoMes: 13_000,
      folhaMes: 2_500,
      cnae: '6201-5/01',
      tipoMei: 'geral',
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(expect.objectContaining({
      ok: true,
      summary: expect.objectContaining({
        faturamentoAcumulado: 35_000,
        folhaAcumulada: 10_500,
      }),
      transition: expect.objectContaining({
        from: 'V',
        to: 'III',
        ano: 2026,
        mes: 3,
      }),
    }))

    expect(supabase.upsertMock).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1',
      ano: 2026,
      mes: 3,
      faturamento_mes: 13_000,
      folha_mes: 2_500,
      cnae: '6201-5/01',
      tipo_mei: 'geral',
      anexo_calculado: 'III',
      tax_rule_version: expect.any(String),
    }), { onConflict: 'user_id,ano,mes' })
  })
})
