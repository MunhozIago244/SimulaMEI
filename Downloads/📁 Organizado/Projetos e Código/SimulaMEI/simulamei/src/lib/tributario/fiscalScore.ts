import type { ResultadoSimulacao } from '@/types/tributario'

export function calcFiscalScore(resultado: ResultadoSimulacao): number {
  const { alertaTeto, fatorR, entrada } = resultado
  let score = 100

  if (alertaTeto.percentualExcesso > 0.20) score -= 50
  else if (alertaTeto.percentualExcesso > 0) score -= 35
  else if (alertaTeto.percentualUtilizado > 0.85) score -= 20
  else if (alertaTeto.percentualUtilizado > 0.70) score -= 8

  if (fatorR && !fatorR.atingeMinimo && fatorR.fatorR > 0) score -= 15
  else if (fatorR === null && resultado.comparativo.simplesAnexoAtual.aliquotaEfetiva > 0.10) score -= 5

  if (!entrada.cnae) score -= 10

  return Math.max(0, Math.min(100, score))
}

export function getFiscalScoreEstado(score: number) {
  if (score >= 75) return { label: 'Saudável', color: 'var(--lime)' }
  if (score >= 50) return { label: 'Atenção', color: 'var(--yellow)' }
  if (score >= 25) return { label: 'Risco', color: 'var(--orange)' }
  return { label: 'Crítico', color: 'var(--red)' }
}
