import { normalizeBoundedText, normalizeEmail } from '@/lib/validation'

export const ACCOUNTANT_CLIENT_RANGES = ['1-20', '21-50', '51-150', '150+'] as const

export type AccountantClientRange = typeof ACCOUNTANT_CLIENT_RANGES[number]

export const ACCOUNTANT_TOOL_OPTIONS = [
  'Planilha',
  'Sistema contábil',
  'Controle manual',
  'Outro',
] as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface AccountantLeadPayload {
  email?: unknown
  nomeEscritorio?: unknown
  telefone?: unknown
  carteiraRange?: unknown
  ferramentaAtual?: unknown
  consentimentoLgpd?: unknown
}

export interface NormalizedAccountantLead {
  email: string
  nomeEscritorio: string
  telefone: string | null
  carteiraRange: AccountantClientRange
  ferramentaAtual: string | null
  consentimentoLgpd: true
}

export type AccountantLeadValidationResult =
  | { ok: true; value: NormalizedAccountantLead }
  | { ok: false; error: string }

export function isAccountantClientRange(value: unknown): value is AccountantClientRange {
  return typeof value === 'string' && ACCOUNTANT_CLIENT_RANGES.includes(value as AccountantClientRange)
}

export function normalizeAccountantLeadPayload(payload: AccountantLeadPayload): AccountantLeadValidationResult {
  const email = normalizeEmail(payload.email)
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: 'Informe um e-mail profissional válido.' }
  }

  const nomeEscritorio = normalizeBoundedText(payload.nomeEscritorio, 160)
  if (!nomeEscritorio) {
    return { ok: false, error: 'Informe o nome do escritório.' }
  }

  if (!isAccountantClientRange(payload.carteiraRange)) {
    return { ok: false, error: 'Informe a faixa de clientes MEI gerenciados.' }
  }

  if (payload.consentimentoLgpd !== true) {
    return { ok: false, error: 'Aceite a política de privacidade para solicitar acesso.' }
  }

  return {
    ok: true,
    value: {
      email,
      nomeEscritorio,
      telefone: normalizeBoundedText(payload.telefone ?? '', 32),
      carteiraRange: payload.carteiraRange,
      ferramentaAtual: normalizeBoundedText(payload.ferramentaAtual ?? '', 80),
      consentimentoLgpd: true,
    },
  }
}
