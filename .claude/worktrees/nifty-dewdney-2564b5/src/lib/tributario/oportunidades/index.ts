import type { ResultadoSimulacao } from '@/types/tributario'
import { gerarOportunidadeFatorR } from './fatorR'
import { gerarOportunidadeRegime } from './regimes'
import { gerarOportunidadeTetoMei } from './tetoMei'
import type { OportunidadeFiscal } from './types'

const PESO_PRIORIDADE: Record<OportunidadeFiscal['prioridade'], number> = {
  alta: 3,
  media: 2,
  baixa: 1,
}

export function gerarOportunidadesFiscais(
  resultado: ResultadoSimulacao,
): OportunidadeFiscal[] {
  return [
    gerarOportunidadeTetoMei(resultado),
    gerarOportunidadeFatorR(resultado),
    gerarOportunidadeRegime(resultado),
  ]
    .filter((item): item is OportunidadeFiscal => Boolean(item))
    .sort((a, b) => {
      const prioridade = PESO_PRIORIDADE[b.prioridade] - PESO_PRIORIDADE[a.prioridade]
      if (prioridade !== 0) return prioridade
      return b.impactoEstimadoAnual - a.impactoEstimadoAnual
    })
}

export type { EvidenciaFiscal, OportunidadeFiscal } from './types'
