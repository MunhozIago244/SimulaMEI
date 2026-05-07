import type { Anexo } from '@/types/tributario'

export type TipoOportunidadeFiscal =
  | 'fator_r'
  | 'teto_mei'
  | 'comparativo_regime'
  | 'mei_caminhoneiro'
  | 'curadoria_pendente'

export type PrioridadeOportunidade = 'alta' | 'media' | 'baixa'
export type RiscoOportunidade = 'baixo' | 'medio' | 'alto' | 'critico'
export type ConfiancaOportunidade = 'oficial' | 'curada' | 'estimada' | 'pendente'

export interface EvidenciaFiscal {
  fonteId: string
  titulo: string
  url: string
  tipo: 'norma' | 'catalogo_oficial' | 'calculo' | 'curadoria'
  hashSha256?: string
  acessadoEm?: string
  observacao?: string
}

export interface OportunidadeFiscal {
  id: string
  tipo: TipoOportunidadeFiscal
  prioridade: PrioridadeOportunidade
  titulo: string
  resumo: string
  impactoEstimadoAnual: number
  risco: RiscoOportunidade
  confianca: ConfiancaOportunidade
  regraVersao: string
  anexoOrigem?: Anexo
  anexoDestino?: Anexo
  acoes: string[]
  bloqueios: string[]
  evidencias: EvidenciaFiscal[]
}
