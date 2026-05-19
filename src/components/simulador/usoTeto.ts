/**
 * Percentual real de uso do teto MEI (projeção ÷ teto × 100).
 *
 * NÃO é capado: o rótulo "X% do teto" deve refletir o uso verdadeiro e
 * ficar coerente com o "EXCESSO TETO" exibido no mesmo card. Capar o
 * rótulo (bug anterior: travado em 130) subestima o risco fiscal.
 */
export function usoTetoPercent(projecao: number, teto: number): number {
  if (teto <= 0) return 0
  return (projecao / teto) * 100
}

/** Largura da barra de progresso: limitada a 0–100% (a barra não transborda). */
export function barraTetoWidth(pct: number): number {
  return Math.min(Math.max(pct, 0), 100)
}
