import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  createClientMock,
  createAdminClientMock,
  getCurrentAccountantOfficeMock,
  createBrandedCheckoutSessionMock,
  isStripeConfiguredMock,
  upsertSubscriptionMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  createAdminClientMock: vi.fn(),
  getCurrentAccountantOfficeMock: vi.fn(),
  createBrandedCheckoutSessionMock: vi.fn(),
  isStripeConfiguredMock: vi.fn(),
  upsertSubscriptionMock: vi.fn(),
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

vi.mock('@/lib/stripe', () => ({
  STRIPE_PRODUCTS: {
    accountant_starter: {
      product: 'accountant_starter',
      priceId: 'price_starter',
      valorCentavos: 9700,
      successPath: '/upgrade/contador?checkout=success&plan=starter',
      cancelPath: '/upgrade/contador?checkout=cancel&plan=starter',
    },
    accountant_pro: {
      product: 'accountant_pro',
      priceId: 'price_pro',
      valorCentavos: 24700,
      successPath: '/upgrade/contador?checkout=success&plan=pro',
      cancelPath: '/upgrade/contador?checkout=cancel&plan=pro',
    },
  },
  getCheckoutUrl: (path: string) => `http://localhost:3000${path}`,
  createBrandedCheckoutSession: createBrandedCheckoutSessionMock,
  isStripeConfigured: isStripeConfiguredMock,
}))

import { POST } from './route'

const OFFICE = {
  id: 'office-1',
  name: 'Prime Contabilidade',
  plan: 'starter_trial',
  max_clients: 30,
  trial_ends_at: null,
  role: 'owner',
}

function makeServerClient(user: { id: string; email?: string } | null = { id: 'user-1', email: 'ana@contabil.com' }) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
  }
}

function makeAdminClient() {
  const fromMock = vi.fn((table: string) => {
    if (table !== 'office_subscriptions') {
      throw new Error(`Unexpected table: ${table}`)
    }

    return {
      upsert: upsertSubscriptionMock,
    }
  })

  return { from: fromMock }
}

function makeRequest() {
  return new NextRequest('http://localhost/api/checkout/accountant-starter', {
    method: 'POST',
  })
}

describe('/api/checkout/accountant-starter POST', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isStripeConfiguredMock.mockReturnValue(true)
    createClientMock.mockResolvedValue(makeServerClient())
    createAdminClientMock.mockReturnValue(makeAdminClient())
    getCurrentAccountantOfficeMock.mockResolvedValue({ office: OFFICE, error: null })
    createBrandedCheckoutSessionMock.mockResolvedValue({
      id: 'cs_starter_1',
      url: 'https://checkout.stripe.com/cs_starter_1',
    })
    upsertSubscriptionMock.mockResolvedValue({ error: null })
  })

  it('requires authentication', async () => {
    createClientMock.mockResolvedValue(makeServerClient(null))

    const response = await POST(makeRequest())

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'Autenticação obrigatória para assinar o plano contador.',
    })
    expect(createBrandedCheckoutSessionMock).not.toHaveBeenCalled()
  })

  it('requires an existing accountant office', async () => {
    getCurrentAccountantOfficeMock.mockResolvedValue({ office: null, error: null })

    const response = await POST(makeRequest())

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      error: 'Crie o escritório contador antes de assinar um plano.',
    })
    expect(createBrandedCheckoutSessionMock).not.toHaveBeenCalled()
  })

  it('creates a subscription checkout session linked to the office and records it as pending', async () => {
    const response = await POST(makeRequest())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      url: 'https://checkout.stripe.com/cs_starter_1',
    })

    expect(createBrandedCheckoutSessionMock).toHaveBeenCalledWith(expect.objectContaining({
      product: 'accountant_starter',
      userId: 'user-1',
      userEmail: 'ana@contabil.com',
      mode: 'subscription',
      extraMetadata: expect.objectContaining({
        office_id: 'office-1',
        plan: 'starter',
      }),
    }))

    expect(upsertSubscriptionMock).toHaveBeenCalledWith(expect.objectContaining({
      office_id: 'office-1',
      status: 'pending',
      plan: 'starter',
      stripe_checkout_session_id: 'cs_starter_1',
    }), { onConflict: 'office_id' })
  })
})
