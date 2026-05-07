// anexos.ts — Tabelas do Simples Nacional (Anexos I–V)
// Fonte: Resolução CGSN nº 140/2018 — vigente em 2026
// TAX_RULE_VERSION: 'BR-MEI-SN-2026-04-28'

import type { Faixa, Anexo } from '@/types/tributario'

// Cada faixa: limiteSuperior em R$, aliquotaNominal e parcelaDeduzir como decimais
// ex: 4% = 0.04, R$ 5.940 = 5940

const ANEXO_I: Faixa[] = [
  { faixa: 1, limiteSuperior: 180_000,     aliquotaNominal: 0.0400, parcelaDeduzir: 0 },
  { faixa: 2, limiteSuperior: 360_000,     aliquotaNominal: 0.0730, parcelaDeduzir: 5_940 },
  { faixa: 3, limiteSuperior: 720_000,     aliquotaNominal: 0.0950, parcelaDeduzir: 13_860 },
  { faixa: 4, limiteSuperior: 1_800_000,   aliquotaNominal: 0.1070, parcelaDeduzir: 22_500 },
  { faixa: 5, limiteSuperior: 3_600_000,   aliquotaNominal: 0.1430, parcelaDeduzir: 87_300 },
  { faixa: 6, limiteSuperior: 4_800_000,   aliquotaNominal: 0.1900, parcelaDeduzir: 378_000 },
]

const ANEXO_II: Faixa[] = [
  { faixa: 1, limiteSuperior: 180_000,     aliquotaNominal: 0.0450, parcelaDeduzir: 0 },
  { faixa: 2, limiteSuperior: 360_000,     aliquotaNominal: 0.0780, parcelaDeduzir: 5_940 },
  { faixa: 3, limiteSuperior: 720_000,     aliquotaNominal: 0.1000, parcelaDeduzir: 13_860 },
  { faixa: 4, limiteSuperior: 1_800_000,   aliquotaNominal: 0.1120, parcelaDeduzir: 22_500 },
  { faixa: 5, limiteSuperior: 3_600_000,   aliquotaNominal: 0.1470, parcelaDeduzir: 85_500 },
  { faixa: 6, limiteSuperior: 4_800_000,   aliquotaNominal: 0.3000, parcelaDeduzir: 720_000 },
]

const ANEXO_III: Faixa[] = [
  // CPP inclusa no DAS
  { faixa: 1, limiteSuperior: 180_000,     aliquotaNominal: 0.0600, parcelaDeduzir: 0 },
  { faixa: 2, limiteSuperior: 360_000,     aliquotaNominal: 0.1120, parcelaDeduzir: 9_360 },
  { faixa: 3, limiteSuperior: 720_000,     aliquotaNominal: 0.1350, parcelaDeduzir: 17_640 },
  { faixa: 4, limiteSuperior: 1_800_000,   aliquotaNominal: 0.1600, parcelaDeduzir: 35_640 },
  { faixa: 5, limiteSuperior: 3_600_000,   aliquotaNominal: 0.2100, parcelaDeduzir: 125_640 },
  { faixa: 6, limiteSuperior: 4_800_000,   aliquotaNominal: 0.3300, parcelaDeduzir: 648_000 },
]

const ANEXO_IV: Faixa[] = [
  // ⚠️ CPP (INSS patronal ~20% sobre folha) é paga FORA do DAS
  { faixa: 1, limiteSuperior: 180_000,     aliquotaNominal: 0.0450, parcelaDeduzir: 0 },
  { faixa: 2, limiteSuperior: 360_000,     aliquotaNominal: 0.0900, parcelaDeduzir: 8_100 },
  { faixa: 3, limiteSuperior: 720_000,     aliquotaNominal: 0.1020, parcelaDeduzir: 12_420 },
  { faixa: 4, limiteSuperior: 1_800_000,   aliquotaNominal: 0.1400, parcelaDeduzir: 39_780 },
  { faixa: 5, limiteSuperior: 3_600_000,   aliquotaNominal: 0.2200, parcelaDeduzir: 183_780 },
  { faixa: 6, limiteSuperior: 4_800_000,   aliquotaNominal: 0.3300, parcelaDeduzir: 828_000 },
]

const ANEXO_V: Faixa[] = [
  // TI, consultoria, engenharia, publicidade — pode migrar p/ Anexo III com Fator R ≥ 28%
  { faixa: 1, limiteSuperior: 180_000,     aliquotaNominal: 0.1550, parcelaDeduzir: 0 },
  { faixa: 2, limiteSuperior: 360_000,     aliquotaNominal: 0.1800, parcelaDeduzir: 4_500 },
  { faixa: 3, limiteSuperior: 720_000,     aliquotaNominal: 0.1950, parcelaDeduzir: 9_900 },
  { faixa: 4, limiteSuperior: 1_800_000,   aliquotaNominal: 0.2050, parcelaDeduzir: 17_100 },
  { faixa: 5, limiteSuperior: 3_600_000,   aliquotaNominal: 0.2300, parcelaDeduzir: 62_100 },
  { faixa: 6, limiteSuperior: 4_800_000,   aliquotaNominal: 0.3050, parcelaDeduzir: 540_000 },
]

export const TABELAS_SIMPLES: Record<Anexo, Faixa[]> = {
  I: ANEXO_I,
  II: ANEXO_II,
  III: ANEXO_III,
  IV: ANEXO_IV,
  V: ANEXO_V,
}

/**
 * Retorna a faixa correta para um RBT12 (Receita Bruta dos últimos 12 meses).
 */
export function getFaixa(rbt12: number, anexo: Anexo): Faixa {
  const tabela = TABELAS_SIMPLES[anexo]
  const faixa = tabela.find(f => rbt12 <= f.limiteSuperior)
  // Se ultrapassou todas as faixas, retorna a última (limite do Simples Nacional)
  return faixa ?? tabela[tabela.length - 1]
}

/**
 * Calcula a alíquota efetiva do Simples Nacional.
 * Fórmula: (RBT12 × alíquota_nominal − parcela_deduzir) / RBT12
 */
export function calcularAliquotaEfetiva(rbt12: number, anexo: Anexo): number {
  if (rbt12 <= 0) return 0
  const faixa = getFaixa(rbt12, anexo)
  return (rbt12 * faixa.aliquotaNominal - faixa.parcelaDeduzir) / rbt12
}

/**
 * Calcula o DAS anual a partir do RBT12 e da alíquota efetiva.
 * A UI deriva o valor mensal dividindo o total anual por 12.
 */
export function calcularDAS(rbt12: number, aliquotaEfetiva: number): number {
  return rbt12 * aliquotaEfetiva
}
