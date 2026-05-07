import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { ResultadoSimulacao } from '@/types/tributario'

const {
  createClientMock,
  getCnaeMock,
  normalizeCnaeCodeMock,
  simularMock,
  hashIpAddressMock,
  getClientIpMock,
  getUserAgentMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getCnaeMock: vi.fn(),
  normalizeCnaeCodeMock: vi.fn(),
  simularMock: vi.fn(),
  hashIpAddressMock: vi.fn(),
  getClientIpMock: vi.fn(),
  getUserAgentMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/tributario', () => ({
  getCnae: getCnaeMock,
  normalizeCnaeCode: normalizeCnaeCodeMock,
  simular: simularMock,
}))

vi.mock('@/lib/security/hash', () => ({
  hashIpAddress: hashIpAddressMock,
}))

vi.mock('@/lib/security/request', () => ({
  getClientIp: getClientIpMock,
  getUserAgent: getUserAgentMock,
}))

import { POST } from './route'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/onboarding', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeSupabaseMock(options?: {
  user?: { id: string; email?: string } | null
  profileError?: { message: string } | null
  simulationError?: { message: string } | null
}) {
  const resolvedUser = options && 'user' in options
    ? options.user
    : { id: 'user-1', email: 'ana@example.com' }
  const profileUpsertMock = vi.fn().mockResolvedValue({ error: options?.profileError ?? null })
  const simulationInsertMock = vi.fn().mockResolvedValue({ error: options?.simulationError ?? null })
  const fromMock = vi.fn((table: string) => {
    if (table === 'user_profiles') {
      return { upsert: profileUpsertMock }
    }

    if (table === 'simulations') {
      return { insert: simulationInsertMock }
    }

    throw new Error(`Unexpected table: ${table}`)
  })

  return {
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: resolvedUser } }),
      },
      from: fromMock,
    },
    profileUpsertMock,
    simulationInsertMock,
  }
}

const fakeResultado = {
  entrada: {
    faturamentoAcumulado: 54000,
    mesAtual: 6,
    cnae: '6204-0/00',
    folhaMensal: 1000,
    tipoMei: 'geral',
  },
  alertaTeto: {
    limiteAplicavel: 81000,
    percentualUtilizado: 0.66,
    projecaoAnual: 108000,
    cenario: 'dentro_limite',
    excessoEstimado: 0,
  },
  fatorR: null,
  anexoAtual: 'III',
  comparativo: {
    simplesAnexoAtual: { anexo: 'III', aliquotaEfetiva: 0.06, dasMensal: 540, dasAnual: 6480 },
    presumido: { total: 12000, irpj: 1000, csll: 500, pis: 800, cofins: 3000, iss: 3600, inss: 3100 },
    real: { total: 16000, margemAssumida: 0.3 },
    melhorRegime: 'simplesAtual',
    economiaVsMelhor: 0,
  },
  taxRuleVersion: 'TEST',
  geradoEm: '2026-04-30T10:00:00.000Z',
} as unknown as ResultadoSimulacao

function validPayload() {
  return {
    nome: 'Ana',
    nomeNegocio: 'Studio Fiscal',
    telefone: '(11) 99999-9999',
    cnaePrincipal: '6204000',
    tipoMei: 'geral',
    municipio: 'Sao Paulo',
    uf: 'SP',
    faturamentoMensalEstimado: 9000,
    faturamentoAcumuladoAtual: 54000,
    folhaMensal: 1000,
    mesAtual: 6,
    objetivoPrincipal: 'Pagar menos imposto',
  }
}

describe('/api/onboarding POST', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hashIpAddressMock.mockReturnValue('hashed-ip')
    getClientIpMock.mockReturnValue('127.0.0.1')
    getUserAgentMock.mockReturnValue('Vitest')
    normalizeCnaeCodeMock.mockImplementation((value: string) => value)
    getCnaeMock.mockReturnValue({ cnae: '6204-0/00' })
    simularMock.mockReturnValue(fakeResultado)
  })

  it('requires an authenticated user', async () => {
    createClientMock.mockResolvedValue(makeSupabaseMock({ user: null }).client)

    const response = await POST(makeRequest(validPayload()))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Autenticação obrigatória.' })
  })

  it('rejects unknown CNAE codes with 400', async () => {
    createClientMock.mockResolvedValue(makeSupabaseMock().client)
    normalizeCnaeCodeMock.mockReturnValueOnce('9999-9/99')
    getCnaeMock.mockReturnValueOnce(undefined)

    const response = await POST(makeRequest(validPayload()))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'CNAE não reconhecido. Informe um código oficial válido.',
    })
    expect(simularMock).not.toHaveBeenCalled()
  })

  it('returns 500 when profile persistence fails', async () => {
    createClientMock.mockResolvedValue(makeSupabaseMock({
      profileError: { message: 'upsert failed' },
    }).client)

    const response = await POST(makeRequest(validPayload()))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'Não foi possível salvar o pré-cadastro.',
    })
  })

  it('stores the profile and bootstrap simulation for valid onboarding payloads', async () => {
    const supabase = makeSupabaseMock()
    createClientMock.mockResolvedValue(supabase.client)
    normalizeCnaeCodeMock.mockReturnValueOnce('6204-0/00')

    const response = await POST(makeRequest(validPayload()))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(supabase.profileUpsertMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'user-1',
      email: 'ana@example.com',
      cnae_principal: '6204-0/00',
      tipo_mei: 'geral',
      municipio: 'Sao Paulo',
      uf: 'SP',
      faturamento_mensal_estimado: 9000,
      faturamento_acumulado_atual: 54000,
      folha_mensal: 1000,
      mes_atual: 6,
      objetivo_principal: 'Pagar menos imposto',
    }), { onConflict: 'id' })
    expect(simularMock).toHaveBeenCalledWith({
      faturamentoAcumulado: 54000,
      mesAtual: 6,
      cnae: '6204-0/00',
      folhaMensal: 1000,
      tipoMei: 'geral',
    })
    expect(supabase.simulationInsertMock).toHaveBeenCalledWith({
      user_id: 'user-1',
      entrada: {
        faturamentoAcumulado: 54000,
        mesAtual: 6,
        cnae: '6204-0/00',
        folhaMensal: 1000,
        tipoMei: 'geral',
      },
      resultado: fakeResultado,
      ip_hash: 'hashed-ip',
      user_agent: 'Vitest',
    })
  })
})
