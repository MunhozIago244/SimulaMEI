import { describe, expect, it } from 'vitest'
import { getConfiguredAdminEmails, isAdminEmail, normalizeAdminEmail } from './admin-access'

describe('admin access helpers', () => {
  it('normalizes admin emails', () => {
    expect(normalizeAdminEmail(' Admin@SimulaMEI.com.br ')).toBe('admin@simulamei.com.br')
    expect(normalizeAdminEmail(undefined)).toBe('')
  })

  it('supports ADMIN_EMAIL and ADMIN_EMAILS', () => {
    const env = {
      ADMIN_EMAIL: 'owner@simulamei.com.br',
      ADMIN_EMAILS: 'admin@simulamei.com.br, suporte@simulamei.com.br;dev@simulamei.com.br',
    }

    expect(getConfiguredAdminEmails(env)).toEqual([
      'admin@simulamei.com.br',
      'suporte@simulamei.com.br',
      'dev@simulamei.com.br',
      'owner@simulamei.com.br',
    ])
    expect(isAdminEmail('ADMIN@simulamei.com.br', env)).toBe(true)
    expect(isAdminEmail('cliente@simulamei.com.br', env)).toBe(false)
  })
})
