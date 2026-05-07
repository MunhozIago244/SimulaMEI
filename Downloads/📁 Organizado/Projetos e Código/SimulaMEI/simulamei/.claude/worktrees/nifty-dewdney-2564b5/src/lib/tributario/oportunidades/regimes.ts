import type { ResultadoSimulacao } from '@/types/tributario'
import { REGIME_LABELS } from '@/constants/tributario'
import { TAX_RULE_VERSION } from '../limitesMei'
import { FONTES_FISCAIS } from './fontes'
import type { OportunidadeFiscal } from './types'

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export function gerarOportunidadeRegime(
  resultado: ResultadoSimulacao,
): OportunidadeFiscal | null {
  const economia = resultado.comparativo.economiaVsMelhor
  if (economia <= 0) return null

  const melhor = resultado.comparativo.melhorRegime

  return {
    id: 'comparativo-regime-economia',
    tipo: 'comparativo_regime',
    prioridade: economia >= 5_000 ? 'alta' : 'media',
    titulo: `${REGIME_LABELS[melhor]} pode ser mais econômico neste cenário`,
    resumo: `O comparativo estimou economia anual de ${BRL.format(economia)} em relação ao custo atual simulado.`,
    impactoEstimadoAnual: economia,
    risco: 'medio',
    confianca: 'estimada',
    regraVersao: TAX_RULE_VERSION,
    acoes: [
      'Validar premissas de margem, folha e tipo de serviço antes de decidir.',
      'Conferir efeitos de ISS, retenções e obrigações acessórias.',
      'Usar o resultado como triagem para conversa com contador.',
    ],
    bloqueios: [],
    evidencias: [
      FONTES_FISCAIS.resolucaoCgsn140,
      {
        fonteId: 'calculo-comparativo-regimes',
        titulo: 'Comparativo interno entre Simples, Presumido e Real',
        url: 'internal:src/lib/tributario/index.ts',
        tipo: 'calculo',
      },
    ],
  }
}
