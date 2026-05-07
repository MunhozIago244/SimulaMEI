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

import { PATCH } from './route'

const OFFICE = {
  id: 'office-1',
  name: 'Prime Contabilidade',
  plan: 'pro',
  max_clients: 150,
  trial_ends_at: null,
  stripe_customer_id: 'cus_1',
  stripe_subscription_id: 'sub_1',
  stripe_subscription_status: 'active',
  current_period_end: null,
  role: 'owner',
}

function makeRequest() {
  return new NextRequest('http://localhost/api/accountant/alerts/alert-1/resolve', {
    method: 'PATCH',
  })
}

function makeContext(id = 'alert-1') {
  return { params: Promise.resolve({ id }) }
}

function makeServerClient(user: { id: string } | null = { id: 'user-1' }) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
  }
}

function makeMutationQuery(result: Record<string, unknown>) {
  const query = {
    eq: vi.fn(() => query),
    is: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(result)),
  }
  return query
}

function makeAdminClient() {
  const updateQuery = makeMutationQuery({
    data: {
      id: 'alert-1',
      office_id: 'office-1',
      resolved_by: 'user-1',
      resolved_at: '2026-05-01T12:00:00.000Z',
    },
    error: null,
  })
  const updateMock = vi.fn(() => updateQuery)
  const fromMock = vi.fn((table: string) => {
    if (table !== 'office_alerts') {
      throw new Error(`Unexpected table: ${table}`)
    }

    return { update: updateMock }
  })

  return {
    client: { from: fromMock },
    updateMock,
    updateQuery,
  }
}

describe('/api/accountant/alerts/[id]/resolve PATCH', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createClientMock.mockResolvedValue(makeServerClient())
    getCurrentAccountantOfficeMock.mockResolvedValue({ office: OFFICE, error: null })
  })

  it('requires authentication', async () => {
    createClientMock.mockResolvedValue(makeServerClient(null))

    const response = await PATCH(makeRequest(), makeContext())

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Autenticação obrigatória.' })
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })

  it('resolves an alert scoped to the current office and records the resolver', async () => {
    const admin = makeAdminClient()
    createAdminClientMock.mockReturnValue(admin.client)

    const response = await PATCH(makeRequest(), makeContext())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      alert: {
        id: 'alert-1',
        office_id: 'office-1',
        resolved_by: 'user-1',
        resolved_at: '2026-05-01T12:00:00.000Z',
      },
    })
    expect(admin.updateMock).toHaveBeenCalledWith({
      resolved_at: expect.any(String),
      resolved_by: 'user-1',
    })
    expect(admin.updateQuery.eq).toHaveBeenCalledWith('id', 'alert-1')
    expect(admin.updateQuery.eq).toHaveBeenCalledWith('office_id', 'office-1')
    expect(admin.updateQuery.is).toHaveBeenCalledWith('resolved_at', null)
  })
})
