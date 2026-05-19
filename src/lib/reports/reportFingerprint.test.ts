import { describe, expect, it } from 'vitest'
import { reportFingerprint } from './reportFingerprint'

const base = { cnae: '6201-5/01', tipoMei: 'geral', mesAtual: 5, faturamentoAcumulado: 68000, folhaMensal: 4000 }

describe('reportFingerprint', () => {
  it('é determinístico (mesmos inputs → mesmo hash)', () => {
    expect(reportFingerprint(base)).toBe(reportFingerprint({ ...base }))
  })

  it('independe da ordem das chaves', () => {
    const reordered = { folhaMensal: 4000, faturamentoAcumulado: 68000, mesAtual: 5, tipoMei: 'geral', cnae: '6201-5/01' }
    expect(reportFingerprint(reordered)).toBe(reportFingerprint(base))
  })

  it('muda quando um input muda', () => {
    expect(reportFingerprint({ ...base, cnae: '6204-0/00' })).not.toBe(reportFingerprint(base))
    expect(reportFingerprint({ ...base, faturamentoAcumulado: 70000 })).not.toBe(reportFingerprint(base))
  })

  it('coerção numérica: "4000" e 4000 são o mesmo', () => {
    expect(reportFingerprint({ ...base, folhaMensal: '4000' as unknown as number }))
      .toBe(reportFingerprint(base))
  })

  it('ignora campos fora do conjunto (taxRuleVersion/geradoEm não afetam)', () => {
    expect(reportFingerprint({ ...base, taxRuleVersion: 'X', geradoEm: '2026-01-01' } as never))
      .toBe(reportFingerprint(base))
  })

  it('null/undefined → hash estável (entrada vazia)', () => {
    expect(reportFingerprint(null)).toBe(reportFingerprint(undefined))
  })
})
