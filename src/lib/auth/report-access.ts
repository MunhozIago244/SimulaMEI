/** Acesso ao relatório completo: plano pro OU ao menos 1 compra paga. */
export function hasReportAccess(
  plan: string | null | undefined,
  purchasesCount: number,
): boolean {
  return plan === 'pro' || purchasesCount > 0
}
