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

import { DELETE, GET, PATCH } from './route'

const OFFICE = {
  id: 'office-1',
  name: 'Prime Contabilidade',
  plan: 'starter_trial',
  max_clients: 30,
  trial_ends_at: null,
  role: 'owner',
}

function makeRequest(body?: unknown) {
  return new NextRequest('http://localhost/api/accountant/clients/client-1', {
    method: body ? 'PATCH' : 'GET',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(id = 'client-1') {
  return { params: Promise.resolve({ id }) }
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
    select: vi.fn(() => query),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: T) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  }
  return query
}

function makeAdminClient(options?: {
  detailRow?: Record<string, unknown> | null
  activeCount?: number
  updateRow?: Record<string, unknown>
}) {
  const detailRow = options && 'detailRow' in options
    ? options.detailRow
    : { id: 'client-1', name: 'Loja Modelo' }
  const detailQuery = makeQuery({ data: detailRow, error: null })
  const countQuery = makeQuery({ data: null, error: null, count: options?.activeCount ?? 0 })
  const updateQuery = makeQuery({
    data: options?.updateRow ?? { id: 'client-1', name: 'Loja Modelo', ativo: false, inactive_reason: 'manual' },
    error: null,
  })

  const selectMock = vi.fn((_columns: string, queryOptions?: { head?: boolean }) =>
    queryOptions?.head ? countQuery : detailQuery,
  )
  const updateMock = vi.fn(() => updateQuery)
  const fromMock = vi.fn((table: string) => {
    if (table !== 'office_clients') {
      throw new Error(`Unexpected table: ${table}`)
    }

    return {
      select: selectMock,
      update: updateMock,
    }
  })

  return {
    client: { from: fromMock },
    detailQuery,
    countQuery,
    updateQuery,
    updateMock,
  }
}

describe('/api/accountant/clients/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createClientMock.mockResolvedValue(makeServerClient())
    getCurrentAccountantOfficeMock.mockResolvedValue({ office: OFFICE, error: null })
  })

  it('returns 404 when the client is not in the current office', async () => {
    const admin = makeAdminClient({ detailRow: null })
    createAdminClientMock.mockReturnValue(admin.client)

    const response = await GET(makeRequest(), makeContext())

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: 'Cliente não encontrado.' })
    expect(admin.detailQuery.eq).toHaveBeenCalledWith('office_id', 'office-1')
    expect(admin.detailQuery.eq).toHaveBeenCalledWith('id', 'client-1')
  })

  it('updates a client scoped to the current office', async () => {
    const admin = makeAdminClient({
      updateRow: { id: 'client-1', name: 'Cliente Atualizado', ativo: true },
    })
    createAdminClientMock.mockReturnValue(admin.client)

    const response = await PATCH(makeRequest({
      nome: 'Cliente Atualizado',
      cnae: '4712-1/00',
      tipoMei: 'geral',
    }), makeContext())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      client: { id: 'client-1', name: 'Cliente Atualizado', ativo: true },
    })
    expect(admin.updateMock).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Cliente Atualizado',
      cnae: '4712-1/00',
      tipo_mei: 'geral',
    }))
    expect(admin.updateQuery.eq).toHaveBeenCalledWith('office_id', 'office-1')
  })

  it('soft deletes a client with manual inactive reason', async () => {
    const admin = makeAdminClient()
    createAdminClientMock.mockReturnValue(admin.client)

    const response = await DELETE(makeRequest(), makeContext())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      client: { id: 'client-1', name: 'Loja Modelo', ativo: false, inactive_reason: 'manual' },
    })
    expect(admin.updateMock).toHaveBeenCalledWith(expect.objectContaining({
      ativo: false,
      inactive_reason: 'manual',
      disabled_by_plan_limit_at: null,
    }))
  })
})
