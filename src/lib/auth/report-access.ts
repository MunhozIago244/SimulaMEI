/** Acesso ao relatório: plano pro OU fingerprint da simulação atual já pago. */
export function hasReportAccess(params: {
  plan: string | null | undefined
  paidFingerprints: string[]
  currentFingerprint: string | null | undefined
}): boolean {
  if (params.plan === 'pro') return true
  const fp = params.currentFingerprint
  return Boolean(fp) && params.paidFingerprints.includes(fp as string)
}
