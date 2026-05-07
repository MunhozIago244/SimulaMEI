import { normalizeBoundedText } from '@/lib/validation'

export const ACCOUNTANT_OFFICE_PLANS = ['starter_trial', 'starter', 'pro', 'enterprise'] as const
export const ACCOUNTANT_MEMBER_ROLES = ['owner', 'admin', 'member'] as const

export type AccountantOfficePlan = typeof ACCOUNTANT_OFFICE_PLANS[number]
export type AccountantMemberRole = typeof ACCOUNTANT_MEMBER_ROLES[number]

export const ACCOUNTANT_PLAN_LIMITS: Record<AccountantOfficePlan, number> = {
  starter_trial: 30,
  starter: 30,
  pro: 150,
  enterprise: 10000,
}

export interface AccountantOfficeOnboardingPayload {
  nomeEscritorio?: unknown
  cnpj?: unknown
  telefone?: unknown
  carteiraRange?: unknown
  ferramentaAtual?: unknown
  objetivo?: unknown
}

export interface NormalizedAccountantOfficeOnboarding {
  nomeEscritorio: string
  cnpj: string | null
  telefone: string | null
  carteiraRange: string
  ferramentaAtual: string | null
  objetivo: string | null
}

export type AccountantOfficeOnboardingResult =
  | { ok: true; value: NormalizedAccountantOfficeOnboarding }
  | { ok: false; error: string }

const CNPJ_DIGITS_RE = /^\d{14}$/
const VALID_CLIENT_RANGES = new Set(['1-20', '21-50', '51-150', '150+'])

function normalizeCnpj(value: unknown) {
  if (typeof value !== 'string') return null
  const digits = value.replace(/\D/g, '')
  if (!digits) return null
  return CNPJ_DIGITS_RE.test(digits) ? digits : ''
}

export function normalizeAccountantOfficeOnboarding(
  payload: AccountantOfficeOnboardingPayload,
): AccountantOfficeOnboardingResult {
  const nomeEscritorio = normalizeBoundedText(payload.nomeEscritorio, 160)
  if (!nomeEscritorio) {
    return { ok: false, error: 'Informe o nome do escritório.' }
  }

  const cnpj = normalizeCnpj(payload.cnpj)
  if (cnpj === '') {
    return { ok: false, error: 'CNPJ deve conter 14 dígitos ou ficar em branco.' }
  }

  const carteiraRange = normalizeBoundedText(payload.carteiraRange, 16)
  if (!carteiraRange || !VALID_CLIENT_RANGES.has(carteiraRange)) {
    return { ok: false, error: 'Informe a faixa de clientes MEI gerenciados.' }
  }

  return {
    ok: true,
    value: {
      nomeEscritorio,
      cnpj,
      telefone: normalizeBoundedText(payload.telefone ?? '', 32),
      carteiraRange,
      ferramentaAtual: normalizeBoundedText(payload.ferramentaAtual ?? '', 80),
      objetivo: normalizeBoundedText(payload.objetivo ?? '', 160),
    },
  }
}

export function getAccountantPlanLimit(plan: AccountantOfficePlan | string | null | undefined) {
  if (plan && plan in ACCOUNTANT_PLAN_LIMITS) {
    return ACCOUNTANT_PLAN_LIMITS[plan as AccountantOfficePlan]
  }

  return ACCOUNTANT_PLAN_LIMITS.starter_trial
}
