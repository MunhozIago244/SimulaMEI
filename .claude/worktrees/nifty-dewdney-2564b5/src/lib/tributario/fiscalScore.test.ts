import { describe, expect, it } from 'vitest'
import { calcFiscalScore, getFiscalScoreEstado } from './fiscalScore'
import type { ResultadoSimulacao } from '@/types/tributario'

// Helper para montar um ResultadoSimulacao mínimo
function makeResultado(overrides: Partial<{
  percentualExcesso: number
  percentualUtilizado: number
  fatorRAtinge: boolean | null  // null = CNAE não elegível
  fatorRVal: number
  aliquotaEfetiva: number
  cnae: string
}>): ResultadoSimulacao {
  const {
    percentualExcesso = 0,
    percentualUtilizado = 0.5,
    fatorRAtinge = null,
    fatorRVal = 0,
    aliquotaEfetiva = 0.06,
    cnae = '6204-0/00',
  } = overrides

  return {
    entrada: {
      faturamentoAcumulado: 40000,
      mesAtual: 6,
      cnae,
      folhaMensal: 2000,
      tipoMei: 'geral',
    },
    alertaTeto: {
      faturamentoAcumulado: 40000,
      tetoAnual: 81000,
      tipoMei: 'geral',
      projecaoAnual: 80000,
      diferenca: 1000,
      percentualUtilizado,
      mesesRestantes: 6,
      mesesParaTeto: null,
      mesEstourarTeto: null,
      cenario: 'dentro_limite',
      excessoProjetado: 0,
      percentualExcesso,
    },
    fatorR: fatorRAtinge === null ? null : {
      folha12meses: 24000,
      rbt12: 80000,
      fatorR: fatorRVal,
      fatorRPercent: fatorRVal * 100,
      atingeMinimo: fatorRAtinge,
      anexoResultante: fatorRAtinge ? 'III' : 'V',
      proLaboreMinimo: 22400 / 12,
      economiaAnual: 2000,
    },
    anexoAtual: fatorRAtinge === false ? 'V' : 'III',
    comparativo: {
      simplesAnexoAtual: {
        rbt12: 80000,
        faixa: 1,
        aliquotaNominal: 0.06,
        parcelaDeduzir: 0,
        aliquotaEfetiva,
        dasAnual: 80000 * aliquotaEfetiva,
        dasMensal: (80000 * aliquotaEfetiva) / 12,
        anexo: 'III',
      },
      presumido: { receitaAnual: 80000, irpj: 3000, csll: 1000, pis: 500, cofins: 2000, iss: 4000, total: 10500, aliquotaEfetiva: 0.131 },
      real: { receitaAnual: 80000, margemLiquida: 0.3, lucroEstimado: 24000, irpj: 2000, csll: 800, pis: 300, cofins: 1200, iss: 3000, total: 7300, aliquotaEfetiva: 0.091 },
      melhorRegime: 'simplesAtual',
      economiaVsMelhor: 0,
    },
    taxRuleVersion: 'TEST',
    geradoEm: new Date().toISOString(),
  } as unknown as ResultadoSimulacao
}

// ─── calcFiscalScore ──────────────────────────────────────────────────────────

describe('calcFiscalScore', () => {
  it('retorna 100 para situação ideal — dentro do teto, fatorR atingido, CNAE informado', () => {
    const score = calcFiscalScore(makeResultado({
      percentualExcesso: 0,
      percentualUtilizado: 0.5,
      fatorRAtinge: true,
      fatorRVal: 0.30,
      cnae: '6204-0/00',
    }))
    expect(score).toBe(100)
  })

  it('desconta 50 pontos quando excesso acima de 20%', () => {
    const score = calcFiscalScore(makeResultado({ percentualExcesso: 0.25 }))
    expect(score).toBe(50)
  })

  it('desconta 35 pontos quando excesso está entre 0% e 20%', () => {
    const score = calcFiscalScore(makeResultado({ percentualExcesso: 0.10 }))
    expect(score).toBe(65)
  })

  it('desconta 20 pontos quando utilizado > 85% sem excesso', () => {
    const score = calcFiscalScore(makeResultado({
      percentualExcesso: 0,
      percentualUtilizado: 0.90,
    }))
    expect(score).toBe(80)
  })

  it('desconta 8 pontos quando utilizado entre 70% e 85%', () => {
    const score = calcFiscalScore(makeResultado({
      percentualExcesso: 0,
      percentualUtilizado: 0.75,
    }))
    expect(score).toBe(92)
  })

  it('desconta 15 pontos quando fatorR está abaixo do mínimo e maior que 0', () => {
    const score = calcFiscalScore(makeResultado({
      fatorRAtinge: false,
      fatorRVal: 0.15,
    }))
    expect(score).toBe(85)
  })

  it('desconta 5 pontos quando CNAE não é elegível ao fatorR mas alíquota > 10%', () => {
    const score = calcFiscalScore(makeResultado({
      fatorRAtinge: null,
      aliquotaEfetiva: 0.12,
    }))
    expect(score).toBe(95)
  })

  it('não vai abaixo de 0 mesmo com múltiplos problemas simultâneos', () => {
    const score = calcFiscalScore(makeResultado({
      percentualExcesso: 0.30,  // -50
      fatorRAtinge: false,       // -15
      fatorRVal: 0.10,
      aliquotaEfetiva: 0.15,
      percentualUtilizado: 0.95, // -20 (mas já deduziu excesso)
    }))
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('não vai acima de 100', () => {
    const score = calcFiscalScore(makeResultado({
      percentualExcesso: 0,
      percentualUtilizado: 0.1,
      fatorRAtinge: true,
      fatorRVal: 0.35,
    }))
    expect(score).toBeLessThanOrEqual(100)
  })
})

// ─── getFiscalScoreEstado ─────────────────────────────────────────────────────

describe('getFiscalScoreEstado', () => {
  it('retorna Saudável para score >= 75', () => {
    expect(getFiscalScoreEstado(100).label).toBe('Saudável')
    expect(getFiscalScoreEstado(75).label).toBe('Saudável')
    expect(getFiscalScoreEstado(75).color).toBe('var(--lime)')
  })

  it('retorna Atenção para score entre 50 e 74', () => {
    expect(getFiscalScoreEstado(74).label).toBe('Atenção')
    expect(getFiscalScoreEstado(50).label).toBe('Atenção')
    expect(getFiscalScoreEstado(60).color).toBe('var(--yellow)')
  })

  it('retorna Risco para score entre 25 e 49', () => {
    expect(getFiscalScoreEstado(49).label).toBe('Risco')
    expect(getFiscalScoreEstado(25).label).toBe('Risco')
    expect(getFiscalScoreEstado(35).color).toBe('var(--orange)')
  })

  it('retorna Crítico para score abaixo de 25', () => {
    expect(getFiscalScoreEstado(24).label).toBe('Crítico')
    expect(getFiscalScoreEstado(0).label).toBe('Crítico')
    expect(getFiscalScoreEstado(10).color).toBe('var(--red)')
  })

  it('cobre todos os limiares de fronteira sem sobreposição', () => {
    const labels = [100, 75, 74, 50, 49, 25, 24, 0].map(s => getFiscalScoreEstado(s).label)
    expect(labels).toEqual([
      'Saudável', 'Saudável',
      'Atenção',  'Atenção',
      'Risco',    'Risco',
      'Crítico',  'Crítico',
    ])
  })
})
