import { describe, expect, it } from 'vitest'
import { REPORT_PRICE_CENTAVOS, REPORT_PRICE_BRL, REPORT_PRICE_LABEL, formatBRL, reportSpendSummary } from './pricing'

describe('pricing', () => {
  it('fixa o preço do relatório em R$ 9,90', () => {
    expect(REPORT_PRICE_CENTAVOS).toBe(990)
    expect(REPORT_PRICE_BRL).toBe(9.9)
    expect(REPORT_PRICE_LABEL).toBe('R$ 9,90')
  })

  it('formata centavos como BRL pt-BR', () => {
    expect(formatBRL(990)).toBe('R$ 9,90')
    expect(formatBRL(2900)).toBe('R$ 29,00')
    expect(formatBRL(0)).toBe('R$ 0,00')
  })
})

describe('reportSpendSummary', () => {
  it('formata o gasto acumulado como BRL (não float cru)', () => {
    expect(reportSpendSummary(1, 19).moneySpentLabel).toBe('R$ 9,90')
    expect(reportSpendSummary(2, 19).moneySpentLabel).toBe('R$ 19,80')
    expect(reportSpendSummary(4, 19).moneySpentLabel).toBe('R$ 39,60')
    expect(reportSpendSummary(0, 19).moneySpentLabel).toBe('R$ 0,00')
  })

  it('deriva meses de Pro equivalentes a partir do mesmo valor (ratio em BRL)', () => {
    expect(reportSpendSummary(1, 19).monthsOfProEquivalent).toBe(0)
    expect(reportSpendSummary(2, 19).monthsOfProEquivalent).toBe(1)
    expect(reportSpendSummary(4, 19).monthsOfProEquivalent).toBe(2)
  })
})
