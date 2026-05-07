// limitesMei.ts — Teto MEI vigente, exceções e cenários legislativos não vigentes
// TAX_RULE_VERSION: 'BR-MEI-SN-2026-04-28'
// Fonte: gov.br/empresas-e-negocios — condições para ser MEI

import type { TipoMei } from '@/types/tributario'

export const TAX_RULE_VERSION = 'BR-MEI-SN-2026-04-28' as const

// ─── REGRAS VIGENTES ────────────────────────────────────────────────────────

export const LIMITES_MEI = {
  geral: {
    anual: 81_000,
    mensalProporcional: 6_750, // para ano de abertura: proporcional aos meses
  },
  caminhoneiro: {
    // MEI transportador autônomo de cargas (Resolução CGSN 140/2018 art. 100-A)
    anual: 251_600,
    mensalProporcional: 20_966.67,
  },
} as const

// Tolerância vigente: excesso de até 20% do teto
// → efeitos a partir de 1º de janeiro do ano seguinte (DAS complementar)
// Excesso acima de 20%
// → retroativo desde 1º de janeiro do ano do excesso + multa 0,33%/dia + Selic
export const TOLERANCIA_EXCESSO = 0.20

// ─── CENÁRIOS LEGISLATIVOS NÃO VIGENTES ────────────────────────────────────
// ⚠️ Exibir APENAS como "projeto em tramitação", nunca como regra vigente

export const CENARIOS_LEGISLATIVOS_NAO_VIGENTES = [
  {
    id: 'PLP_60_2025',
    nome: 'PLP 60/2025 — Super MEI',
    tetoAnual: 140_000,
    status: 'em_tramitacao' as const,
    descricao: 'Proposta de aumento do teto MEI para R$ 140.000/ano',
    fonte: 'https://www25.senado.leg.br/web/atividade/materias/-/materia/167495',
  },
  {
    id: 'PLP_67_2025',
    nome: 'PLP 67/2025',
    tetoAnual: 150_000,
    status: 'em_tramitacao' as const,
    descricao: 'Proposta de aumento do teto MEI para R$ 150.000/ano',
    fonte: 'https://www.camara.leg.br/noticias/1198523',
  },
] as const

// ─── HELPERS ────────────────────────────────────────────────────────────────

export function getTetoAnual(tipo: TipoMei): number {
  return LIMITES_MEI[tipo].anual
}

export function getTetoMensalProporcional(tipo: TipoMei): number {
  return LIMITES_MEI[tipo].mensalProporcional
}

/**
 * Para MEIs no ano de abertura: o teto é proporcional aos meses restantes.
 * @param tipo - 'geral' ou 'caminhoneiro'
 * @param mesAbertura - mês em que o MEI foi aberto (1–12)
 */
export function getTetoAnoProporcional(tipo: TipoMei, mesAbertura: number): number {
  const mesesAtivos = 13 - mesAbertura // ex: abriu em março (3) → 10 meses ativos
  return getTetoMensalProporcional(tipo) * mesesAtivos
}
