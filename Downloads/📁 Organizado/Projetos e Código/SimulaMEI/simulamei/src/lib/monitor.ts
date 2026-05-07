import { calcularProLaboreIdeal, calcularSimples, getCnae } from '@/lib/tributario'
import type { Anexo, TipoMei } from '@/types/tributario'

export interface MonthlyInputLike {
  ano: number
  mes: number
  faturamentoMes: number
  folhaMes: number
  fatorR?: number | null
  anexoCalculado?: Anexo | string | null
}

export interface MonthlyMonitorSummary {
  rbt12: number
  faturamentoAcumulado: number
  folhaAcumulada: number
  projecaoAnual: number
  fatorRAtual: number
  dasMensalEstimado: number
  proLaboreIdeal: number
}

export interface FiscalCalendarItem {
  title: string
  body: string
  channel: 'email' | 'dashboard'
}

export function summarizeMonthlyMonitor({
  cnae,
  mesAtual,
  historico,
}: {
  cnae: string
  tipoMei: TipoMei
  mesAtual: number
  historico: MonthlyInputLike[]
}): MonthlyMonitorSummary {
  const ordered = [...historico].sort((a, b) => (a.ano * 100 + a.mes) - (b.ano * 100 + b.mes))
  const faturamentoAcumulado = ordered.reduce((sum, item) => sum + item.faturamentoMes, 0)
  const folhaAcumulada = ordered.reduce((sum, item) => sum + item.folhaMes, 0)
  const projecaoAnual = mesAtual > 0 ? (faturamentoAcumulado / mesAtual) * 12 : faturamentoAcumulado
  const rbt12 = faturamentoAcumulado
  const fatorRAtual = rbt12 > 0 ? folhaAcumulada / rbt12 : 0
  const info = getCnae(cnae)
  const anexo = info?.elegivelFatorR && fatorRAtual >= 0.28 ? 'III' : info?.anexoPadrao ?? 'III'
  const dasMensalEstimado = calcularSimples(projecaoAnual, anexo).dasMensal

  return {
    rbt12,
    faturamentoAcumulado,
    folhaAcumulada,
    projecaoAnual,
    fatorRAtual,
    dasMensalEstimado,
    proLaboreIdeal: calcularProLaboreIdeal(projecaoAnual),
  }
}

export function detectAnexoTransition(inputs: Pick<MonthlyInputLike, 'ano' | 'mes' | 'anexoCalculado' | 'fatorR'>[]) {
  if (inputs.length < 2) return null

  const ordered = [...inputs].sort((a, b) => (a.ano * 100 + a.mes) - (b.ano * 100 + b.mes))
  const previous = ordered.at(-2)
  const current = ordered.at(-1)

  if (!previous || !current || !previous.anexoCalculado || !current.anexoCalculado) {
    return null
  }

  if (previous.anexoCalculado === current.anexoCalculado) {
    return null
  }

  return {
    from: previous.anexoCalculado,
    to: current.anexoCalculado,
    ano: current.ano,
    mes: current.mes,
    fatorR: current.fatorR ?? 0,
  }
}

export function getFiscalCalendarItems({
  mes,
  nome,
  tipoMei,
  anexoAtual,
  elegivelFatorR,
}: {
  mes: number
  nome: string
  tipoMei: TipoMei
  anexoAtual: Anexo
  elegivelFatorR: boolean
}): FiscalCalendarItem[] {
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' })
    .format(new Date(2026, Math.max(0, mes - 1), 1))
  const monthTitle = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  const items: FiscalCalendarItem[] = [
    {
      title: `${monthTitle}: revisar faturamento acumulado`,
      body: `${nome || 'Sua conta'} deve conferir o ritmo de faturamento para não perder o enquadramento do ${tipoMei === 'caminhoneiro' ? 'MEI Caminhoneiro' : 'MEI'}.`,
      channel: 'dashboard',
    },
    {
      title: `${monthTitle}: conferir a DAS do mês`,
      body: 'Use a simulação mensal para validar o imposto antes do pagamento e ajustar a projeção do ano.',
      channel: 'dashboard',
    },
    {
      title: `${monthTitle}: lembrete por e-mail`,
      body: 'Disparo programado para lembrar obrigações fiscais, projeção do teto e próxima revisão do regime.',
      channel: 'email',
    },
  ]

  if (elegivelFatorR) {
    items.push({
      title: `${monthTitle}: revisar Fator R`,
      body: `Seu enquadramento atual está no Anexo ${anexoAtual}. O pró-labore pode mudar essa leitura nos próximos ciclos.`,
      channel: 'email',
    })
  }

  return items
}
