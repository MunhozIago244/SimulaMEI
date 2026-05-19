import { describe, expect, it } from 'vitest'
import { hasReportAccess } from './report-access'

describe('hasReportAccess', () => {
  it('libera para plano pro', () => {
    expect(hasReportAccess('pro', 0)).toBe(true)
  })
  it('libera quando há ao menos uma compra', () => {
    expect(hasReportAccess('free', 1)).toBe(true)
    expect(hasReportAccess(null, 2)).toBe(true)
  })
  it('bloqueia free/null sem compra', () => {
    expect(hasReportAccess('free', 0)).toBe(false)
    expect(hasReportAccess(null, 0)).toBe(false)
    expect(hasReportAccess(undefined, 0)).toBe(false)
  })
})
