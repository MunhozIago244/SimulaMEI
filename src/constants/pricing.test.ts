import { describe, expect, it } from 'vitest'
import { REPORT_PRICE_CENTAVOS, REPORT_PRICE_BRL, REPORT_PRICE_LABEL, formatBRL } from './pricing'

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
