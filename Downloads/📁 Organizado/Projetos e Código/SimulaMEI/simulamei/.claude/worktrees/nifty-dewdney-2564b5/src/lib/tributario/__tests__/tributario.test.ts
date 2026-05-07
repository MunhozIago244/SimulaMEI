import { describe, expect, it } from 'vitest'
import { buscarCnaes, CNAE_OFICIAL_TOTAL, simular } from '../index'
import { calcularAlertaTeto, getCorUrgencia, getMensagemAlerta, getNomeMes } from '../alertas'
import { analisarFatorR, calcularFatorR, calcularProLaboreIdeal, determinarAnexo } from '../fatorR'
import { calcularCustoRealAnexoIV, calcularSimples } from '../simples'
import { calcularPresumidoServicos } from '../presumido'
import { calcularReal } from '../real'
import { getCnae } from '../cnae'
import { getCnaeDetalhe } from '../cnaeDetalhe'

describe('motor tributario', () => {
  it('projects MEI revenue from accumulated revenue only once', () => {
    const resultado = simular({
      faturamentoAcumulado: 54_000,
      mesAtual: 4,
      cnae: '6201-5/01',
      folhaMensal: 0,
      tipoMei: 'geral',
    })

    expect(resultado.alertaTeto.faturamentoAcumulado).toBe(54_000)
    expect(resultado.alertaTeto.projecaoAnual).toBe(162_000)
    expect(resultado.comparativo.simplesAnexoAtual.rbt12).toBe(162_000)
  })

  it('classifies excess above 20 percent as severe', () => {
    const alerta = calcularAlertaTeto(54_000, 4, 'geral')

    expect(alerta.projecaoAnual).toBe(162_000)
    expect(alerta.percentualExcesso).toBeCloseTo(1)
    expect(alerta.cenario).toBe('excesso_grave')
  })

  it('classifies projected excess up to 20 percent as light', () => {
    const alerta = calcularAlertaTeto(75_000, 10, 'geral')

    expect(alerta.projecaoAnual).toBe(90_000)
    expect(alerta.cenario).toBe('excesso_leve')
    expect(alerta.percentualExcesso).toBeLessThanOrEqual(0.2)
  })

  it('keeps month-to-ceiling fields null when the current pace stays below the limit', () => {
    const alerta = calcularAlertaTeto(50_000, 8, 'geral')

    expect(alerta.cenario).toBe('dentro_limite')
    expect(alerta.mesesParaTeto).toBe(5)
    expect(alerta.mesEstourarTeto).toBeNull()
  })

  it('returns urgency colors by ceiling usage band', () => {
    expect(getCorUrgencia(0.4)).toBe('verde')
    expect(getCorUrgencia(0.8)).toBe('amarelo')
    expect(getCorUrgencia(0.95)).toBe('vermelho')
  })

  it('maps month numbers to Portuguese names and rejects invalid values', () => {
    expect(getNomeMes(1)).toBe('Janeiro')
    expect(getNomeMes(12)).toBe('Dezembro')
    expect(getNomeMes(13)).toBe('')
  })

  it('builds the correct alert copy for each ceiling scenario', () => {
    expect(getMensagemAlerta(calcularAlertaTeto(20_000, 6, 'geral'))).toContain('Você está tranquilo')
    expect(
      getMensagemAlerta({
        ...calcularAlertaTeto(40_000, 6, 'geral'),
        cenario: 'dentro_limite',
        percentualUtilizado: 0.62,
        mesEstourarTeto: 11,
      }),
    ).toContain('Novembro')
    expect(getMensagemAlerta(calcularAlertaTeto(50_000, 8, 'geral'))).toContain('R$ 31.000')
    expect(getMensagemAlerta(calcularAlertaTeto(75_000, 10, 'geral'))).toContain('DAS complementar')
    expect(getMensagemAlerta(calcularAlertaTeto(54_000, 4, 'geral'))).toContain('Risco alto')
  })

  it('uses caminhoneiro MEI ceiling for transport cargo CNAE', () => {
    const resultado = simular({
      faturamentoAcumulado: 90_000,
      mesAtual: 6,
      cnae: '4930-2/02',
      folhaMensal: 0,
      tipoMei: 'caminhoneiro',
    })

    expect(resultado.alertaTeto.tetoAnual).toBe(251_600)
    expect(resultado.alertaTeto.cenario).toBe('dentro_limite')
  })

  it('keeps Fator R threshold at 28 percent', () => {
    const resultado = simular({
      faturamentoAcumulado: 75_000,
      mesAtual: 6,
      cnae: '6201-5/01',
      folhaMensal: 3_500,
      tipoMei: 'geral',
    })

    expect(resultado.fatorR).not.toBeNull()
    expect(resultado.fatorR?.fatorR).toBeCloseTo(0.28)
    expect(resultado.anexoAtual).toBe('III')
  })

  it('computes Fator R helpers for below-threshold and zero-revenue cases', () => {
    const abaixo = calcularFatorR(24_000, 120_000)
    const zero = calcularFatorR(10_000, 0)

    expect(abaixo.atingeMinimo).toBe(false)
    expect(abaixo.anexoResultante).toBe('V')
    expect(abaixo.proLaboreMinimo).toBe(2_800)
    expect(zero.fatorR).toBe(0)
    expect(zero.economiaAnual).toBe(0)
  })

  it('determines the effective annex and ideal payroll target around Fator R', () => {
    expect(determinarAnexo('IV', true, 0.5)).toBe('IV')
    expect(determinarAnexo('V', false, 0.5)).toBe('V')
    expect(determinarAnexo('V', true, 0.3)).toBe('III')
    expect(determinarAnexo('III', true, 0.2)).toBe('V')
    expect(calcularProLaboreIdeal(120_000)).toBe(2_800)

    const analise = analisarFatorR(120_000, 2_000)
    expect(analise.atingeMinimo).toBe(false)
    expect(analise.fatorRPercent).toBeCloseTo(20)
    expect(analise.diferencaMensal).toBe(-800)
    expect(analise.proLaboreIdeal).toBe(2_800)
  })

  it('uses simplesOtimo as the canonical best-regime id when Fator R optimization wins', () => {
    const resultado = simular({
      faturamentoAcumulado: 75_000,
      mesAtual: 6,
      cnae: '6201-5/01',
      folhaMensal: 2_000,
      tipoMei: 'geral',
    })

    expect(resultado.comparativo.melhorRegime).toBe('simplesOtimo')
    expect(resultado.comparativo.simplesAnexoOtimo).toBeDefined()
  })

  it('adds CPP outside DAS for Anexo IV real cost', () => {
    const custo = calcularCustoRealAnexoIV(120_000, 3_000)

    expect(custo.cppAnual).toBe(7_200)
    expect(custo.totalReal).toBeGreaterThan(custo.dasAnual)
  })

  it('handles zero and edge branches in regime calculators', () => {
    expect(calcularSimples(0, 'III')).toEqual({
      rbt12: 0,
      faixa: 1,
      aliquotaNominal: 0,
      parcelaDeduzir: 0,
      aliquotaEfetiva: 0,
      dasAnual: 0,
      dasMensal: 0,
    })

    const presumido = calcularPresumidoServicos(1_000_000)
    expect(presumido.irpj).toBeGreaterThan(48_000)

    const realZero = calcularReal(0)
    const realHigh = calcularReal(1_000_000)
    expect(realZero.aliquotaEfetiva).toBe(0)
    expect(realHigh.irpj).toBeGreaterThan(45_000)
  })

  it('searches the full official CNAE catalog without marking uncurated codes as tax-ready', () => {
    const resultados = buscarCnaes('Cultivo de arroz')
    const cultivoArroz = resultados.find(cnae => cnae.cnae === '0111-3/01')

    expect(CNAE_OFICIAL_TOTAL).toBeGreaterThan(1000)
    expect(cultivoArroz?.classificacaoTributaria).toBe('pendente')
  })

  it('returns official CNAE detail with tax curation status', () => {
    const detalhe = getCnaeDetalhe('0111-3/01')

    expect(detalhe?.descricao).toBe('Cultivo de arroz')
    expect(detalhe?.classificacaoTributaria).toBe('pendente')
    expect(detalhe?.hierarquia.secao).toBe('A')
  })

  it('resolves official CNAEs outside the curated map and normalizes raw digits', () => {
    expect(getCnae('0111-3/01')?.descricao).toBe('Cultivo de arroz')
    expect(getCnae('0111301')?.cnae).toBe('0111-3/01')
    expect(getCnae('9999999')).toBeUndefined()
  })
})
