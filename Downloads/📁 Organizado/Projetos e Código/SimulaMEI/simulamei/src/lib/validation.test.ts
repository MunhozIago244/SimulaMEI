import { describe, expect, it } from 'vitest'
import { ONBOARDING_TEXT_LIMITS, normalizeBoundedText } from './validation'

describe('normalizeBoundedText', () => {
  it('trims valid strings and rejects oversized payloads', () => {
    expect(normalizeBoundedText('  Ana Maria  ', ONBOARDING_TEXT_LIMITS.nome)).toBe('Ana Maria')
    expect(
      normalizeBoundedText('x'.repeat(ONBOARDING_TEXT_LIMITS.nome + 1), ONBOARDING_TEXT_LIMITS.nome),
    ).toBeNull()
  })
})
