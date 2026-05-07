import { describe, expect, it } from 'vitest'
import type { ResultadoSimulacao } from '@/types/tributario'
import { calcFiscalScore, getFiscalScoreEstado } from '../fiscalScore'

function makeResultado(overrides: Partial<ResultadoSimulacao> = {}): ResultadoSimulacao {
  return {
    entrada: {
      faturamentoAcumulado: 54_000,
      mesAtual: 4,
      cnae: '6201-5/01',
      folhaMensal: 0,
      tipoMei: 'geral',
    },
    alertaTeto: {
      faturamentoAcumulado: 54_000,
      tetoAnual: 81_000,
      tipoMei: 'geral',
      projecaoAnual: 162_000,
      diferenca: -81_000,
      percentualUtilizado: 2,
      mesesRestantes: 8,
      mesesParaTeto: 2,
      mesEstourarTeto: 6,
      cenario: 'excesso_grave',
      excessoProjetado: 81_000,
      percentualExcesso: 1,
    },
    fatorR: null,
    anexoAtual: 'V',
    comparativo: {
      simplesAnexoAtual: {
        rbt12: 162_000,
        faixa: 1,
        aliquotaNominal: 0.155,
        parcelaDeduzir: 0,
        aliquotaEfetiva: 0.155,
        dasAnual: 25_110,
        dasMensal: 2_092.5,
        anexo: 'V',
      },
      presumido: {
        receitaAnual: 162_000,
        irpj: 0,
        csll: 0,
        pis: 0,
        cofins: 0,
        iss: 0,
        total: 0,
        aliquotaEfetiva: 0,
        categoria: 'servicos',
        presuncaoUtilizada: 0.32,
        inssProLabore: 0,
        inssPatronal: 0,
        custoTotal: 0,
        aliquotaEfetivaCustoTotal: 0,
      },
      real: {
        receitaAnual: 162_000,
        margemLiquida: 0.3,
        lucroEstimado: 48_600,
        irpj: 0,
        csll: 0,
        pis: 0,
        cofins: 0,
        iss: 0,
        total: 0,
        aliquotaEfetiva: 0,
        categoria: 'servicos',
        inssProLabore: 0,
        inssPatronal: 0,
        custoTotal: 0,
        aliquotaEfetivaCustoTotal: 0,
      },
      melhorRegime: 'simplesAtual',
      economiaVsMelhor: 0,
    },
    taxRuleVersion: 'TEST',
    geradoEm: '2026-04-30T10:00:00.000Z',
    ...overrides,
  }
}

describe('calcFiscalScore', () => {
  it('penaliza excesso grave, falta de fator R e CNAE vazio', () => {
    const score = calcFiscalScore(makeResultado({
      entrada: {
        faturamentoAcumulado: 54_000,
        mesAtual: 4,
        cnae: '',
        folhaMensal: 1_000,
        tipoMei: 'geral',
      },
      fatorR: {
        folha12meses: 12_000,
        rbt12: 162_000,
        fatorR: 0.074,
        fatorRPercent: 7.4,
        atingeMinimo: false,
        anexoResultante: 'V',
        proLaboreMinimo: 3_780,
        economiaAnual: 4_500,
      },
    }))

    expect(score).toBe(25)
    expect(getFiscalScoreEstado(score)).toEqual({
      label: 'Risco',
      color: 'var(--orange)',
    })
  })

  it('mantem score saudável em cenário estável', () => {
    const score = calcFiscalScore(makeResultado({
      entrada: {
        faturamentoAcumulado: 32_000,
        mesAtual: 6,
        cnae: '6201-5/01',
        folhaMensal: 2_000,
        tipoMei: 'geral',
      },
      alertaTeto: {
        faturamentoAcumulado: 32_000,
        tetoAnual: 81_000,
        tipoMei: 'geral',
        projecaoAnual: 64_000,
        diferenca: 17_000,
        percentualUtilizado: 0.79,
        mesesRestantes: 6,
        mesesParaTeto: 4,
        mesEstourarTeto: null,
        cenario: 'dentro_limite',
        excessoProjetado: 0,
        percentualExcesso: 0,
      },
      fatorR: {
        folha12meses: 24_000,
        rbt12: 64_000,
        fatorR: 0.375,
        fatorRPercent: 37.5,
        atingeMinimo: true,
        anexoResultante: 'III',
        proLaboreMinimo: 1_493.33,
        economiaAnual: 3_200,
      },
      anexoAtual: 'III',
      comparativo: {
        ...makeResultado().comparativo,
        simplesAnexoAtual: {
          rbt12: 64_000,
          faixa: 1,
          aliquotaNominal: 0.06,
          parcelaDeduzir: 0,
          aliquotaEfetiva: 0.06,
          dasAnual: 3_840,
          dasMensal: 320,
          anexo: 'III',
        },
      },
    }))

    expect(score).toBe(92)
    expect(getFiscalScoreEstado(score)).toEqual({
      label: 'Saudável',
      color: 'var(--lime)',
    })
  })
})
