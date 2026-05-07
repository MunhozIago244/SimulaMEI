import { describe, expect, it } from 'vitest'
import { normalizeOfficeClientSimulation } from './simulations'

const client = {
  cnae: '4712-1/00',
  tipo_mei: 'geral',
}

describe('normalizeOfficeClientSimulation', () => {
  it('uses client fiscal data when cnae and tipoMei are omitted', () => {
    const result = normalizeOfficeClientSimulation({
      faturamentoAcumulado: 42000,
      mesAtual: 6,
      folhaMensal: 1800,
    }, client)

    expect(result).toEqual({
      ok: true,
      value: {
        faturamentoAcumulado: 42000,
        mesAtual: 6,
        folhaMensal: 1800,
        cnae: '4712-1/00',
        tipoMei: 'geral',
      },
    })
  })

  it('rejects invalid month', () => {
    const result = normalizeOfficeClientSimulation({
      faturamentoAcumulado: 42000,
      mesAtual: 13,
      folhaMensal: 1800,
    }, client)

    expect(result).toEqual({ ok: false, error: 'mesAtual deve ser entre 1 e 12.' })
  })

  it('rejects an unknown override CNAE', () => {
    const result = normalizeOfficeClientSimulation({
      faturamentoAcumulado: 42000,
      mesAtual: 6,
      folhaMensal: 1800,
      cnae: '9999999',
    }, client)

    expect(result).toEqual({ ok: false, error: 'CNAE não reconhecido. Informe um código oficial válido.' })
  })
})
