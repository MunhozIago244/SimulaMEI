import { describe, expect, it } from 'vitest'
import type { OportunidadeFiscal } from '../types'
import { FONTES_FISCAIS } from '../fontes'
import { gerarOportunidadeFatorR } from '../fatorR'
import { gerarOportunidadeTetoMei } from '../tetoMei'
import { gerarOportunidadeRegime } from '../regimes'
import { gerarOportunidadesFiscais } from '../index'
import { simular } from '../../index'

describe('oportunidades fiscais', () => {
  it('supports audit-ready opportunity cards', () => {
    const oportunidade: OportunidadeFiscal = {
      id: 'fator-r-minimo',
      tipo: 'fator_r',
      prioridade: 'alta',
      titulo: 'Ajuste de pró-labore pode ativar o Anexo III',
      resumo: 'A atividade é elegível ao Fator R e ainda está abaixo de 28%.',
      impactoEstimadoAnual: 8400,
      risco: 'medio',
      confianca: 'estimada',
      regraVersao: 'BR-MEI-SN-2026-04-28',
      acoes: ['Validar pró-labore com contador'],
      bloqueios: [],
      evidencias: [
        {
          fonteId: 'resolucao-cgsn-140-2018',
          titulo: 'Resolução CGSN nº 140/2018',
          url: 'https://www8.receita.fazenda.gov.br/SimplesNacional/',
          tipo: 'norma',
        },
      ],
    }

    expect(oportunidade.tipo).toBe('fator_r')
    expect(oportunidade.evidencias[0].tipo).toBe('norma')
  })

  it('keeps source references available for opportunity evidence', () => {
    expect(FONTES_FISCAIS.conclaCnae23.tipo).toBe('catalogo_oficial')
    expect(FONTES_FISCAIS.simplesNacionalLegislacao.tipo).toBe('norma')
  })

  it('generates a Fator R opportunity when eligible CNAE is below 28 percent', () => {
    const resultado = simular({
      faturamentoAcumulado: 75_000,
      mesAtual: 6,
      cnae: '6201-5/01',
      folhaMensal: 2_000,
      tipoMei: 'geral',
    })

    const oportunidade = gerarOportunidadeFatorR(resultado)

    expect(oportunidade?.tipo).toBe('fator_r')
    expect(oportunidade?.impactoEstimadoAnual).toBeGreaterThan(0)
    expect(oportunidade?.acoes[0]).toContain('pro-labore')
  })

  it('generates a critical ceiling opportunity when projected revenue exceeds MEI ceiling by more than 20 percent', () => {
    const resultado = simular({
      faturamentoAcumulado: 54_000,
      mesAtual: 4,
      cnae: '6201-5/01',
      folhaMensal: 0,
      tipoMei: 'geral',
    })

    const oportunidade = gerarOportunidadeTetoMei(resultado)

    expect(oportunidade?.tipo).toBe('teto_mei')
    expect(oportunidade?.risco).toBe('critico')
    expect(oportunidade?.prioridade).toBe('alta')
  })

  it('generates a regime comparison opportunity when another regime is cheaper', () => {
    const resultado = simular({
      faturamentoAcumulado: 150_000,
      mesAtual: 6,
      cnae: '6201-5/01',
      folhaMensal: 0,
      tipoMei: 'geral',
    })

    const oportunidade = gerarOportunidadeRegime(resultado)

    expect(oportunidade?.tipo).toBe('comparativo_regime')
    expect(oportunidade?.evidencias.length).toBeGreaterThan(0)
  })

  it('aggregates opportunities ordered by priority and impact', () => {
    const resultado = simular({
      faturamentoAcumulado: 75_000,
      mesAtual: 6,
      cnae: '6201-5/01',
      folhaMensal: 2_000,
      tipoMei: 'geral',
    })

    const oportunidades = gerarOportunidadesFiscais(resultado)

    expect(oportunidades.length).toBeGreaterThan(0)
    expect(oportunidades[0].prioridade).toBe('alta')
  })
})
