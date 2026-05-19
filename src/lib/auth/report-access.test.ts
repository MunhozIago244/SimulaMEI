import { describe, expect, it } from 'vitest'
import { hasReportAccess } from './report-access'

describe('hasReportAccess', () => {
  it('libera plano pro independentemente de fingerprint', () => {
    expect(hasReportAccess({ plan: 'pro', paidFingerprints: [], currentFingerprint: 'x' })).toBe(true)
    expect(hasReportAccess({ plan: 'pro', paidFingerprints: [], currentFingerprint: null })).toBe(true)
  })
  it('libera quando o fingerprint atual está entre os pagos', () => {
    expect(hasReportAccess({ plan: 'free', paidFingerprints: ['a', 'b'], currentFingerprint: 'b' })).toBe(true)
  })
  it('bloqueia quando o fingerprint atual não foi pago', () => {
    expect(hasReportAccess({ plan: 'free', paidFingerprints: ['a'], currentFingerprint: 'z' })).toBe(false)
    expect(hasReportAccess({ plan: null, paidFingerprints: [], currentFingerprint: 'z' })).toBe(false)
  })
  it('bloqueia quando não há fingerprint atual (simulação ausente)', () => {
    expect(hasReportAccess({ plan: 'free', paidFingerprints: ['a'], currentFingerprint: null })).toBe(false)
  })
})
