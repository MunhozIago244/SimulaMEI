import { describe, expect, it } from 'vitest'
import {
  getAccountantBillingState,
  isAccountantBillingRestricted,
} from './billing-state'
import type { CurrentAccountantOffice } from './server'

function makeOffice(overrides: Partial<CurrentAccountantOffice> = {}): CurrentAccountantOffice {
  return {
    id: 'office-1',
    name: 'Prime Contabilidade',
    role: 'owner',
    plan: 'starter',
    max_clients: 30,
    trial_ends_at: null,
    stripe_customer_id: 'cus_1',
    stripe_subscription_id: 'sub_1',
    stripe_subscription_status: 'active',
    current_period_end: '2026-06-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('accountant billing state', () => {
  it('marks an active paid office as unrestricted', () => {
    const state = getAccountantBillingState(makeOffice({ plan: 'pro', max_clients: 150 }))

    expect(state).toEqual(expect.objectContaining({
      kind: 'active',
      severity: 'ok',
      restricted: false,
      planLabel: 'Pro',
      statusLabel: 'Ativa',
      clientLimit: 150,
    }))
    expect(isAccountantBillingRestricted(state)).toBe(false)
  })

  it('marks past_due subscriptions as restricted and actionable', () => {
    const state = getAccountantBillingState(makeOffice({
      stripe_subscription_status: 'past_due',
    }))

    expect(state).toEqual(expect.objectContaining({
      kind: 'past_due',
      severity: 'danger',
      restricted: true,
      statusLabel: 'Pagamento pendente',
      actionLabel: 'Atualizar pagamento',
    }))
    expect(state.description).toContain('regularizar')
    expect(isAccountantBillingRestricted(state)).toBe(true)
  })

  it('marks expired trials as restricted', () => {
    const state = getAccountantBillingState(makeOffice({
      plan: 'starter_trial',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      stripe_subscription_status: null,
      trial_ends_at: '2026-01-01T00:00:00.000Z',
    }), new Date('2026-05-01T12:00:00.000Z'))

    expect(state).toEqual(expect.objectContaining({
      kind: 'trial_expired',
      severity: 'danger',
      restricted: true,
      planLabel: 'Trial Starter',
      actionLabel: 'Escolher plano',
    }))
  })

  it('keeps enterprise outside automated Stripe restriction', () => {
    const state = getAccountantBillingState(makeOffice({
      plan: 'enterprise',
      max_clients: 10000,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      stripe_subscription_status: null,
    }))

    expect(state).toEqual(expect.objectContaining({
      kind: 'enterprise',
      severity: 'ok',
      restricted: false,
      planLabel: 'Enterprise',
      clientLimit: 10000,
      actionLabel: 'Falar com comercial',
    }))
  })
})
