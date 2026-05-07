import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { createClientMock, createAdminClientMock, getCurrentAccountantOfficeMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  createAdminClientMock: vi.fn(),
  getCurrentAccountantOfficeMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/lib/accountant/server', () => ({
  getCurrentAccountantOffice: getCurrentAccountantOfficeMock,
}))

import { GET, POST } from './route'

const OFFICE = {
  id: 'office-1',
  name: 'Prime Contabilidade',
  plan: 'starter_trial',
  max_clients: 30,
  trial_ends_at: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  stripe_subscription_status: null,
  current_period_end: null,
  role: 'owner',
}

function makeRequest(url: string, body?: unknown) {
  return new NextRequest(url, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeServerClient(user: { id: string } | null = { id: 'user-1' }) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
  }
}

function makeQuery<T>(result: T) {
  const query = {
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn(() => Promise.resolve(result)),
    select: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: T) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  }
  return query
}

function makeAdminClient(options?: {
  activeCount?: number
  listRows?: Array<Record<string, unknown>>
  insertRow?: Record<string, unknown>
}) {
  const countQuery = makeQuery({ data: null, error: null, count: options?.activeCount ?? 0 })
  const listQuery = makeQuery({
    data: options?.listRows ?? [],
    error: null,
    count: options?.listRows?.length ?? 0,
  })
  const insertQuery = makeQuery({
    data: options?.insertRow ?? { id: 'client-1', name: 'Loja Modelo' },
    error: null,
  })

  const selectMock = vi.fn((_columns: string, queryOptions?: { head?: boolean }) =>
    queryOptions?.head ? countQuery : listQuery,
  )
  const insertMock = vi.fn(() => insertQuery)
  const fromMock = vi.fn((table: string) => {
    if (table !== 'office_clients') {
      throw new Error(`Unexpected table: ${table}`)
    }

    return {
      select: selectMock,
      insert: insertMock,
    }
  })

  return {
    client: { from: fromMock },
    countQuery,
    listQuery,
    insertQuery,
    selectMock,
    insertMock,
  }
}

describe('/api/accountant/clients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createClientMock.mockResolvedValue(makeServerClient())
    getCurrentAccountantOfficeMock.mockResolvedValue({ office: OFFICE, error: null })
  })

  it('requires authentication on create', async () => {
    createClientMock.mockResolvedValue(makeServerClient(null))

    const response = await POST(makeRequest('http://localhost/api/accountant/clients', {
      nome: 'Cliente',
      cnae: '4712-1/00',
      tipoMei: 'geral',
    }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Autenticação obrigatória.' })
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })

  it('blocks creation when the plan active client limit is reached', async () => {
    const admin = makeAdminClient({ activeCount: 30 })
    createAdminClientMock.mockReturnValue(admin.client)

    const response = await POST(makeRequest('http://localhost/api/accountant/clients', {
      nome: 'Cliente',
      cnae: '4712-1/00',
      tipoMei: 'geral',
    }))

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: 'Limite de 30 clientes ativos atingido para o plano atual.',
    })
    expect(admin.insertMock).not.toHaveBeenCalled()
  })

  it('blocks creation when billing is restricted', async () => {
    getCurrentAccountantOfficeMock.mockResolvedValue({
      office: {
        ...OFFICE,
        plan: 'pro',
        max_clients: 150,
        stripe_customer_id: 'cus_1',
        stripe_subscription_id: 'sub_1',
        stripe_subscription_status: 'past_due',
      },
      error: null,
    })

    const response = await POST(makeRequest('http://localhost/api/accountant/clients', {
      nome: 'Cliente',
      cnae: '4712-1/00',
      tipoMei: 'geral',
    }))

    expect(response.status).toBe(402)
    await expect(response.json()).resolves.toEqual({
      error: 'Regularize a assinatura do escritório para cadastrar novos clientes.',
      billing: expect.objectContaining({
        kind: 'past_due',
        restricted: true,
      }),
    })
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })

  it('creates a client scoped to the current office', async () => {
    const admin = makeAdminClient({ activeCount: 2 })
    createAdminClientMock.mockReturnValue(admin.client)

    const response = await POST(makeRequest('http://localhost/api/accountant/clients', {
      nome: 'Loja Modelo',
      email: 'cliente@example.com',
      cnae: '4712100',
      tipoMei: 'geral',
      uf: 'SP',
      municipio: 'Sao Paulo',
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      client: { id: 'client-1', name: 'Loja Modelo' },
    })
    expect(admin.insertMock).toHaveBeenCalledWith(expect.objectContaining({
      office_id: 'office-1',
      name: 'Loja Modelo',
      email: 'cliente@example.com',
      cnae: '4712-1/00',
      tipo_mei: 'geral',
      uf: 'SP',
      municipio: 'Sao Paulo',
      ativo: true,
      inactive_reason: null,
    }))
  })

  it('lists clients scoped to the current office and requested status', async () => {
    const admin = makeAdminClient({
      listRows: [{ id: 'client-1', name: 'Loja Modelo', ativo: true }],
    })
    createAdminClientMock.mockReturnValue(admin.client)

    const response = await GET(makeRequest('http://localhost/api/accountant/clients?status=active&page=1'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      clients: [{ id: 'client-1', name: 'Loja Modelo', ativo: true }],
      pagination: { page: 1, pageSize: 20, total: 1 },
    })
    expect(admin.listQuery.eq).toHaveBeenCalledWith('office_id', 'office-1')
    expect(admin.listQuery.eq).toHaveBeenCalledWith('ativo', true)
  })
})
