import type { ComparativoRegimes } from '@/types/tributario'

export const REGIME_LABELS: Record<ComparativoRegimes['melhorRegime'], string> = {
  simplesAtual: 'Simples atual',
  simplesOtimo: 'Simples otimizado',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
}
