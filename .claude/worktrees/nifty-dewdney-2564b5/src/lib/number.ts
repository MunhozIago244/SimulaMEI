export function parsePtBrNumber(value: string): number {
  const trimmed = value.trim()
  if (!trimmed) return 0

  let normalized = trimmed
    .replace(/^R\$\s*/i, '')
    .replace(/\s+/g, '')
    .replace(/[^\d,.-]/g, '')

  if (!normalized) return 0

  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  } else {
    const dotMatches = normalized.match(/\./g) ?? []
    if (dotMatches.length > 1) {
      normalized = normalized.replace(/\./g, '')
    } else if (dotMatches.length === 1) {
      const [, fractional = ''] = normalized.split('.')
      if (fractional.length === 3) {
        normalized = normalized.replace('.', '')
      }
    }
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}
