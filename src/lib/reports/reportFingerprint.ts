import { createHash } from 'node:crypto'

export type ReportFingerprintEntrada =
  | {
      cnae?: unknown
      tipoMei?: unknown
      mesAtual?: unknown
      faturamentoAcumulado?: unknown
      folhaMensal?: unknown
      folhaDetalhada?: unknown
    }
  | null
  | undefined

const NUMERIC = new Set(['mesAtual', 'faturamentoAcumulado', 'folhaMensal'])
const FIELDS = ['cnae', 'tipoMei', 'mesAtual', 'faturamentoAcumulado', 'folhaMensal', 'folhaDetalhada'] as const

function canonical(value: unknown): unknown {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map(canonical)
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      const c = canonical((value as Record<string, unknown>)[k])
      if (c !== undefined) out[k] = c
    }
    return out
  }
  return undefined
}

/**
 * Hash estável dos INPUTS da simulação. Exclui timestamps e taxRuleVersion
 * (motor melhora de graça; "mesmos dados = mesmo relatório"). Determinístico.
 */
export function reportFingerprint(entrada: ReportFingerprintEntrada): string {
  const src = (entrada ?? {}) as Record<string, unknown>
  const picked: Record<string, unknown> = {}
  for (const f of FIELDS) {
    const v = src[f]
    if (v === undefined || v === null) continue
    picked[f] = NUMERIC.has(f) ? Number(v) : v
  }
  return createHash('sha256').update(JSON.stringify(canonical(picked))).digest('hex')
}
