import type { ResultadoSimulacao } from '@/types/tributario'
import { TAX_RULE_VERSION } from '../limitesMei'
import { FONTES_FISCAIS } from './fontes'
import type { OportunidadeFiscal } from './types'

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export function gerarOportunidadeTetoMei(
  resultado: ResultadoSimulacao,
): OportunidadeFiscal | null {
  const { alertaTeto } = resultado
  const uso = alertaTeto.percentualUtilizado
  const excesso = alertaTeto.percentualExcesso

  if (uso < 0.85 && excesso <= 0) return null

  const critico = excesso > 0.20
  const acimaDoTeto = excesso > 0

  return {
    id: critico ? 'teto-mei-excesso-grave' : acimaDoTeto ? 'teto-mei-excesso-leve' : 'teto-mei-alerta',
    tipo: 'teto_mei',
    prioridade: critico || acimaDoTeto ? 'alta' : 'media',
    titulo: critico
      ? 'Projeção indica excesso grave do teto MEI'
      : acimaDoTeto
        ? 'Projeção indica excesso dentro da faixa de atenção'
        : 'Projeção próxima ao teto MEI',
    resumo: `A projeção anual está em ${BRL.format(alertaTeto.projecaoAnual)} para teto de ${BRL.format(alertaTeto.tetoAnual)}.`,
    impactoEstimadoAnual: 0,
    risco: critico ? 'critico' : acimaDoTeto ? 'alto' : 'medio',
    confianca: 'estimada',
    regraVersao: TAX_RULE_VERSION,
    acoes: [
      'Revisar faturamento acumulado e notas emitidas no ano.',
      'Simular cenário de desenquadramento de MEI para ME.',
      'Validar prazo e forma de comunicação com contador.',
    ],
    bloqueios: [],
    evidencias: [
      FONTES_FISCAIS.simplesNacionalLegislacao,
      {
        fonteId: 'calculo-alerta-teto',
        titulo: 'Cálculo interno de projeção de teto MEI',
        url: 'internal:src/lib/tributario/alertas.ts',
        tipo: 'calculo',
      },
    ],
  }
}
