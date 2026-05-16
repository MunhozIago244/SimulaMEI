import { describe, expect, it } from 'vitest'
import { formatTaxSourceLine } from './TaxSourceNote'

describe('formatTaxSourceLine', () => {
  it('lists source titles and the engine version label', () => {
    const line = formatTaxSourceLine(
      [{ titulo: 'Resolução CGSN nº 140/2018' }, { titulo: 'Portal do Simples Nacional' }],
      'BR-MEI-SN-2026-04-28',
    )

    expect(line).toBe(
      'Fonte: Resolução CGSN nº 140/2018 · Portal do Simples Nacional · Motor v2026-04-28',
    )
  })

  it('still shows the engine version when no sources are given (auditability contract)', () => {
    expect(formatTaxSourceLine([], 'BR-MEI-SN-2026-04-28')).toBe('Motor v2026-04-28')
  })

  it('passes a version through unchanged when it has no known prefix', () => {
    expect(formatTaxSourceLine([{ titulo: 'X' }], 'v9')).toBe('Fonte: X · Motor v9')
  })
})
