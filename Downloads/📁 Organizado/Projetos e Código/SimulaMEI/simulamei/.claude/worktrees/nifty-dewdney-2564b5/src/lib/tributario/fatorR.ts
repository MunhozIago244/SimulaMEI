// fatorR.ts — Cálculo do Fator R e lógica de migração Anexo III ↔ V
// Fonte: Resolução CGSN nº 140/2018, art. 25-A
// TAX_RULE_VERSION: 'BR-MEI-SN-2026-04-28'

import type { ResultadoFatorR } from '@/types/tributario'
import { calcularAliquotaEfetiva } from './anexos'

export const FATOR_R_MINIMO = 0.28 // 28%

/**
 * Calcula o Fator R.
 * Fator R = Folha de pagamento acumulada (12 meses) / Receita Bruta acumulada (12 meses)
 *
 * Se Fator R >= 28%, a empresa do Anexo V tributa pelo Anexo III naquele período.
 */
export function calcularFatorR(
  folha12meses: number,
  rbt12: number
): ResultadoFatorR {
  const fatorR = rbt12 > 0 ? folha12meses / rbt12 : 0
  const atingeMinimo = fatorR >= FATOR_R_MINIMO
  const anexoResultante = atingeMinimo ? 'III' : 'V'

  // Pró-labore mensal mínimo para atingir 28%: folha_anual_minima / 12
  const proLaboreMinimo = (rbt12 * FATOR_R_MINIMO) / 12

  // Economia: diferença entre pagar Anexo V e Anexo III no mesmo RBT12
  const aliqV = calcularAliquotaEfetiva(rbt12, 'V')
  const aliqIII = calcularAliquotaEfetiva(rbt12, 'III')
  const economiaAnual = rbt12 * (aliqV - aliqIII)

  return {
    folha12meses,
    rbt12,
    fatorR,
    fatorRPercent: fatorR * 100,
    atingeMinimo,
    anexoResultante,
    proLaboreMinimo,
    economiaAnual: Math.max(0, economiaAnual),
  }
}

/**
 * Determina o Anexo correto para um dado CNAE e Fator R.
 * Apenas atividades elegíveis ao Fator R podem migrar entre Anexo III e V.
 */
export function determinarAnexo(
  anexoPadrao: 'III' | 'IV' | 'V',
  elegivelFatorR: boolean,
  fatorR: number
): 'III' | 'IV' | 'V' {
  if (!elegivelFatorR || anexoPadrao === 'IV') return anexoPadrao
  return fatorR >= FATOR_R_MINIMO ? 'III' : 'V'
}

/**
 * Dado um faturamento anual, calcula o valor de folha mensal necessário
 * para atingir Fator R >= 28% (pró-labore ideal).
 *
 * Útil para o componente "Simulador de Pró-labore Ideal".
 */
export function calcularProLaboreIdeal(faturamentoAnual: number): number {
  // Folha anual mínima = faturamento * 28%
  // Folha mensal = folha anual / 12
  return (faturamentoAnual * FATOR_R_MINIMO) / 12
}

/**
 * Dado um faturamento anual e folha mensal, retorna se atingiria 28%
 * e quanto falta (ou sobra) mensalmente.
 */
export function analisarFatorR(
  faturamentoAnual: number,
  folhaMensal: number
): {
  fatorRAtual: number
  fatorRPercent: number
  atingeMinimo: boolean
  diferencaMensal: number // positivo = sobra, negativo = falta
  proLaboreIdeal: number
} {
  const folhaAnual = folhaMensal * 12
  const fatorRAtual = faturamentoAnual > 0 ? folhaAnual / faturamentoAnual : 0
  const proLaboreIdeal = calcularProLaboreIdeal(faturamentoAnual)
  const diferencaMensal = folhaMensal - proLaboreIdeal

  return {
    fatorRAtual,
    fatorRPercent: fatorRAtual * 100,
    atingeMinimo: fatorRAtual >= FATOR_R_MINIMO,
    diferencaMensal,
    proLaboreIdeal,
  }
}
