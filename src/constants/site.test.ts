import { describe, expect, it } from 'vitest'
import { resolveLegalIdentity } from './site'

describe('resolveLegalIdentity', () => {
  it('shows razão social and CNPJ when a tax id is configured', () => {
    const id = resolveLegalIdentity({
      name: 'Munhoz Tech LTDA',
      taxId: '12.345.678/0001-90',
      email: 'contato@example.com',
    })

    expect(id.entityName).toBe('Munhoz Tech LTDA')
    expect(id.taxId).toBe('12.345.678/0001-90')
    expect(id.contactEmail).toBe('contato@example.com')
    expect(id.line).toBe('Munhoz Tech LTDA · CNPJ 12.345.678/0001-90')
  })

  it('falls back to "Operado por <site>" and never fabricates a CNPJ when unset', () => {
    const id = resolveLegalIdentity({})

    expect(id.taxId).toBeNull()
    expect(id.contactEmail).toBeNull()
    expect(id.entityName).toBe('SimulaMEI')
    expect(id.line).toBe('Operado por SimulaMEI')
  })

  it('ignores blank/whitespace env values', () => {
    const id = resolveLegalIdentity({ name: '   ', taxId: '  ', email: ' ' })

    expect(id.entityName).toBe('SimulaMEI')
    expect(id.taxId).toBeNull()
    expect(id.contactEmail).toBeNull()
  })
})
