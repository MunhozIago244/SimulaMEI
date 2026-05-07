import { describe, expect, it } from 'vitest'
import {
  buildOfficeAlertCandidate,
  getOfficeAlertMonthReference,
  getTetoAlertType,
  shouldEmailOfficeAlert,
} from './alerts'
import type { ResultadoSimulacao } from '@/types/tributario'

function makeResultado(percentualUtilizado: number, percentualExcesso = 0): ResultadoSimulacao {
  return {
    entrada: {
      faturamentoAcumulado: 72_000,
      mesAtual: 8,
      cnae: '4712-1/00',
      folhaMensal: 0,
      tipoMei: 'geral',
    },
    alertaTeto: {
      faturamentoAcumulado: 72_000,
      tetoAnual: 81_000,
      tipoMei: 'geral',
      projecaoAnual: 108_000,
      diferenca: -27_000,
      percentualUtilizado,
      mesesRestantes: 4,
      mesesParaTeto: null,
      mesEstourarTeto: 9,
      cenario: percentualUtilizado > 1 ? 'excesso_leve' : 'dentro_limite',
      excessoProjetado: percentualExcesso > 0 ? 27_000 : 0,
      percentualExcesso,
    },
    fatorR: null,
    anexoAtual: 'I',
    comparativo: {
      simplesAnexoAtual: {
        anexo: 'I',
        rbt12: 108_000,
        faixa: 1,
        aliquotaNominal: 0.04,
        parcelaDeduzir: 0,
        aliquotaEfetiva: 0.04,
        dasAnual: 4320,
        dasMensal: 360,
      },
      presumido: {
        receitaAnual: 108_000,
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
        receitaAnual: 108_000,
        margemLiquida: 0.3,
        lucroEstimado: 32_400,
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
    taxRuleVersion: 'BR-MEI-SN-2026-04-28',
    geradoEm: '2026-05-01T12:00:00.000Z',
  }
}

describe('office alert generation', () => {
  it('formats the monthly alert reference as YYYY-MM', () => {
    expect(getOfficeAlertMonthReference(new Date('2026-05-01T12:00:00.000Z'))).toBe('2026-05')
  })

  it.each([
    [0.69, null],
    [0.70, 'teto_70'],
    [0.80, 'teto_80'],
    [0.95, 'teto_95'],
    [1.0, 'teto_100'],
    [1.21, 'teto_excesso_grave'],
  ] as const)('maps %.2f usage to %s', (percentual, expected) => {
    expect(getTetoAlertType(percentual, percentual > 1.2 ? 0.21 : 0)).toBe(expected)
  })

  it('builds a deduplicable alert candidate from the latest client simulation', () => {
    const candidate = buildOfficeAlertCandidate({
      officeId: 'office-1',
      client: {
        id: 'client-1',
        name: 'Loja Modelo',
        cnae: '4712-1/00',
        tipo_mei: 'geral',
      },
      simulation: {
        id: 'simulation-1',
        resultado: makeResultado(0.96),
        created_at: '2026-05-01T12:00:00.000Z',
      },
      mesReferencia: '2026-05',
    })

    expect(candidate).toEqual({
      office_id: 'office-1',
      client_id: 'client-1',
      tipo: 'teto_95',
      mes_referencia: '2026-05',
      payload: expect.objectContaining({
        clientName: 'Loja Modelo',
        cnae: '4712-1/00',
        simulationId: 'simulation-1',
        percentualUtilizado: 0.96,
        projecaoAnual: 108_000,
        taxRuleVersion: 'BR-MEI-SN-2026-04-28',
      }),
    })
  })

  it('only sends email for alerts at 80 percent or above', () => {
    expect(shouldEmailOfficeAlert('teto_70')).toBe(false)
    expect(shouldEmailOfficeAlert('teto_80')).toBe(true)
    expect(shouldEmailOfficeAlert('teto_95')).toBe(true)
    expect(shouldEmailOfficeAlert('teto_100')).toBe(true)
    expect(shouldEmailOfficeAlert('teto_excesso_grave')).toBe(true)
  })
})
