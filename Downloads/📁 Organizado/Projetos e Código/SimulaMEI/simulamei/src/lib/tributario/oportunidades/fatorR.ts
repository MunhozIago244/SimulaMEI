import type { ResultadoSimulacao } from '@/types/tributario'
import { TAX_RULE_VERSION } from '../limitesMei'
import { calcularSimples } from '../simples'
import { FATOR_R_MINIMO } from '../fatorR'
import { FONTES_FISCAIS } from './fontes'
import type { OportunidadeFiscal } from './types'

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export function gerarOportunidadeFatorR(
  resultado: ResultadoSimulacao,
): OportunidadeFiscal | null {
  const { fatorR, alertaTeto, entrada } = resultado
  if (!fatorR || fatorR.atingeMinimo) return null

  const rbt12 = alertaTeto.projecaoAnual
  const economia = Math.max(
    0,
    calcularSimples(rbt12, 'V').dasAnual - calcularSimples(rbt12, 'III').dasAnual,
  )
  if (economia <= 0) return null

  const faltaMensal = Math.max(0, fatorR.proLaboreMinimo - entrada.folhaMensal)

  return {
    id: 'fator-r-minimo',
    tipo: 'fator_r',
    prioridade: 'alta',
    titulo: 'Fator R pode reduzir a tributação para Anexo III',
    resumo: `Com Fator R abaixo de ${(FATOR_R_MINIMO * 100).toFixed(0)}%, este cenário permanece no Anexo V. Ajustar folha/pro-labore pode criar economia estimada.`,
    impactoEstimadoAnual: economia,
    risco: 'medio',
    confianca: 'estimada',
    regraVersao: TAX_RULE_VERSION,
    anexoOrigem: 'V',
    anexoDestino: 'III',
    acoes: [
      `Validar com contador se é possível aumentar pro-labore/folha em aproximadamente ${BRL.format(faltaMensal)} por mês.`,
      'Confirmar se a atividade exercida e o CNAE continuam elegíveis ao Fator R.',
      'Guardar memória de cálculo e documentos de folha/pro-labore.',
    ],
    bloqueios: faltaMensal > 0 ? [] : ['Faltam dados de folha/pro-labore para estimar o ajuste mensal.'],
    evidencias: [
      FONTES_FISCAIS.resolucaoCgsn140,
      {
        fonteId: 'calculo-fator-r',
        titulo: 'Cálculo interno do Fator R',
        url: 'internal:src/lib/tributario/fatorR.ts',
        tipo: 'calculo',
        observacao: 'Fator R = folha 12 meses / receita bruta 12 meses.',
      },
    ],
  }
}
