// alertas.ts — Lógica de teto MEI, projeção de faturamento e cenários de excesso
// TAX_RULE_VERSION: 'BR-MEI-SN-2026-04-28'

import type { AlertaTeto, TipoMei, CenarioExcesso } from '@/types/tributario'
import { getTetoAnual, TOLERANCIA_EXCESSO } from './limitesMei'

/**
 * Calcula o alerta de teto MEI com projeção linear.
 *
 * @param faturamentoAcumulado - Total faturado no ano até o mês atual (R$)
 * @param mesAtual - Mês corrente (1–12)
 * @param tipoMei - 'geral' (R$ 81k) ou 'caminhoneiro' (R$ 251,6k)
 */
export function calcularAlertaTeto(
  faturamentoAcumulado: number,
  mesAtual: number,
  tipoMei: TipoMei = 'geral'
): AlertaTeto {
  const tetoAnual = getTetoAnual(tipoMei)
  const mesesRestantes = 12 - mesAtual
  const mediaMensal = mesAtual > 0 ? faturamentoAcumulado / mesAtual : 0
  const projecaoAnual = faturamentoAcumulado + mediaMensal * mesesRestantes
  const diferenca = tetoAnual - faturamentoAcumulado
  const percentualUtilizado = tetoAnual > 0 ? faturamentoAcumulado / tetoAnual : 0

  // Meses para atingir o teto na projeção atual
  let mesesParaTeto: number | null = null
  let mesEstourarTeto: number | null = null

  if (mediaMensal > 0 && faturamentoAcumulado < tetoAnual) {
    mesesParaTeto = Math.ceil(diferenca / mediaMensal)
    const mesCalculado = mesAtual + mesesParaTeto
    mesEstourarTeto = mesCalculado <= 12 ? mesCalculado : null
  }

  // Cenário de excesso
  const excessoProjetado = Math.max(0, projecaoAnual - tetoAnual)
  const percentualExcesso = tetoAnual > 0 ? excessoProjetado / tetoAnual : 0

  let cenario: CenarioExcesso
  if (excessoProjetado <= 0) {
    cenario = 'dentro_limite'
  } else if (percentualExcesso <= TOLERANCIA_EXCESSO) {
    cenario = 'excesso_leve' // DAS complementar, efeitos em jan/próximo ano
  } else {
    cenario = 'excesso_grave' // retroativo + multa 0,33%/dia + Selic
  }

  return {
    faturamentoAcumulado,
    tetoAnual,
    tipoMei,
    projecaoAnual,
    diferenca,
    percentualUtilizado,
    mesesRestantes,
    mesesParaTeto,
    mesEstourarTeto,
    cenario,
    excessoProjetado,
    percentualExcesso,
  }
}

/**
 * Retorna a cor de urgência baseada no percentual utilizado do teto.
 * Útil para o componente AlertaTeto.tsx.
 */
export function getCorUrgencia(percentualUtilizado: number): 'verde' | 'amarelo' | 'vermelho' {
  if (percentualUtilizado < 0.7) return 'verde'
  if (percentualUtilizado < 0.9) return 'amarelo'
  return 'vermelho'
}

/**
 * Retorna o nome do mês em português.
 */
export function getNomeMes(mes: number): string {
  const meses = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]
  return meses[mes] ?? ''
}

/**
 * Gera a mensagem de alerta personalizada para exibição na UI.
 */
export function getMensagemAlerta(alerta: AlertaTeto): string {
  const { cenario, diferenca, mesEstourarTeto, percentualUtilizado } = alerta

  if (cenario === 'dentro_limite') {
    if (percentualUtilizado < 0.5) {
      return `Você está tranquilo — usou ${(percentualUtilizado * 100).toFixed(0)}% do teto MEI.`
    }
    if (mesEstourarTeto) {
      return `Atenção: no seu ritmo atual, você pode estourar o teto em ${getNomeMes(mesEstourarTeto)}. Ainda dá tempo de planejar a migração.`
    }
    return `Você está a R$ ${diferenca.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} do teto — seguro por enquanto.`
  }

  if (cenario === 'excesso_leve') {
    return `Você deve ultrapassar o teto MEI em até 20%. A migração para ME acontecerá em janeiro do próximo ano — há DAS complementar a pagar, mas sem retroatividade.`
  }

  return `🚨 Risco alto: a projeção indica excesso acima de 20% do teto. Isso gera migração retroativa desde janeiro, com multa de 0,33%/dia e Selic. Procure seu contador agora.`
}
