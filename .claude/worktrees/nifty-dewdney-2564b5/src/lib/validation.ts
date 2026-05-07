export const ONBOARDING_TEXT_LIMITS = {
  nome: 120,
  nomeNegocio: 160,
  telefone: 32,
  municipio: 120,
  objetivoPrincipal: 120,
} as const

export function normalizeBoundedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (trimmed.length > maxLength) return null

  return trimmed
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()
  if (!normalized || normalized.length > 254) return null

  return normalized
}
