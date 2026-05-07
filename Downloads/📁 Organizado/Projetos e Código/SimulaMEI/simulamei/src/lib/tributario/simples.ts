// simples.ts — Cálculo de alíquota efetiva e DAS pelo Simples Nacional
// TAX_RULE_VERSION: 'BR-MEI-SN-2026-04-28'

import type { ResultadoAliquota, Anexo } from '@/types/tributario'
import { getFaixa, calcularAliquotaEfetiva, calcularDAS } from './anexos'

/**
 * Calcula o resultado completo do Simples Nacional para um dado RBT12 e Anexo.
 */
export function calcularSimples(rbt12: number, anexo: Anexo): ResultadoAliquota {
  if (rbt12 <= 0) {
    return {
      rbt12: 0,
      faixa: 1,
      aliquotaNominal: 0,
      parcelaDeduzir: 0,
      aliquotaEfetiva: 0,
      dasAnual: 0,
      dasMensal: 0,
    }
  }

  const faixa = getFaixa(rbt12, anexo)
  const aliquotaEfetiva = calcularAliquotaEfetiva(rbt12, anexo)
  const dasAnual = calcularDAS(rbt12, aliquotaEfetiva)
  const dasMensal = dasAnual / 12

  return {
    rbt12,
    faixa: faixa.faixa,
    aliquotaNominal: faixa.aliquotaNominal,
    parcelaDeduzir: faixa.parcelaDeduzir,
    aliquotaEfetiva,
    dasAnual,
    dasMensal,
  }
}

/**
 * Calcula o custo real do Anexo IV (inclui CPP fora do DAS).
 * CPP = ~20% sobre a folha de pagamento.
 *
 * ⚠️ Este é o "truque" que o SimulaMEI revela: Anexo IV parece barato
 * (4,5% nominal) mas o custo real frequentemente supera o Anexo III.
 */
export function calcularCustoRealAnexoIV(
  rbt12: number,
  folhaMensal: number
): {
  dasAnual: number
  cppAnual: number
  totalReal: number
  aliquotaEfetivaReal: number
} {
  const resultado = calcularSimples(rbt12, 'IV')
  const cppAnual = folhaMensal * 12 * 0.20 // CPP: 20% sobre folha anual
  const totalReal = resultado.dasAnual + cppAnual
  const aliquotaEfetivaReal = rbt12 > 0 ? totalReal / rbt12 : 0

  return {
    dasAnual: resultado.dasAnual,
    cppAnual,
    totalReal,
    aliquotaEfetivaReal,
  }
}
