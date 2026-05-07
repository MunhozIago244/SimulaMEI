import { describe, expect, it } from 'vitest'
import type { TipoMei } from '@/types/tributario'
import { detectAnexoTransition, getFiscalCalendarItems, summarizeMonthlyMonitor } from './monitor'

describe('summarizeMonthlyMonitor', () => {
  it('resume o monitor mensal e calcula o DAS estimado a partir da série', () => {
    const summary = summarizeMonthlyMonitor({
      cnae: '6201-5/01',
      tipoMei: 'geral',
      mesAtual: 4,
      historico: [
        { ano: 2026, mes: 1, faturamentoMes: 10_000, folhaMes: 2_000 },
        { ano: 2026, mes: 2, faturamentoMes: 11_000, folhaMes: 2_000 },
        { ano: 2026, mes: 3, faturamentoMes: 12_000, folhaMes: 2_500 },
        { ano: 2026, mes: 4, faturamentoMes: 13_000, folhaMes: 2_500 },
      ],
    })

    expect(summary.faturamentoAcumulado).toBe(46_000)
    expect(summary.projecaoAnual).toBe(138_000)
    expect(summary.dasMensalEstimado).toBeGreaterThan(0)
    expect(summary.proLaboreIdeal).toBeGreaterThan(0)
  })
})

describe('detectAnexoTransition', () => {
  it('detecta cruzamento recente de anexo no histórico mensal', () => {
    const transition = detectAnexoTransition([
      { ano: 2026, mes: 3, anexoCalculado: 'V', fatorR: 0.26 },
      { ano: 2026, mes: 4, anexoCalculado: 'III', fatorR: 0.31 },
    ])

    expect(transition).toEqual({
      from: 'V',
      to: 'III',
      ano: 2026,
      mes: 4,
      fatorR: 0.31,
    })
  })
})

describe('getFiscalCalendarItems', () => {
  it('gera agenda fiscal coerente com o mês e perfil', () => {
    const items = getFiscalCalendarItems({
      mes: 7,
      nome: 'Ana',
      tipoMei: 'geral' satisfies TipoMei,
      anexoAtual: 'III',
      elegivelFatorR: true,
    })

    expect(items.length).toBeGreaterThanOrEqual(3)
    expect(items[0].title).toContain('Julho')
    expect(items.some(item => item.channel === 'email')).toBe(true)
  })
})
