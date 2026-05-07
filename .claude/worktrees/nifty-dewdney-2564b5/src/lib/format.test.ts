import { describe, expect, it } from 'vitest'
import { fmtK } from './format'

describe('fmtK', () => {
  it('keeps the BRL prefix readable and falls back to fmt below 1000', () => {
    expect(fmtK(81_000)).toBe('R$ 81k')
    expect(fmtK(999)).toBe('R$ 999')
  })
})
