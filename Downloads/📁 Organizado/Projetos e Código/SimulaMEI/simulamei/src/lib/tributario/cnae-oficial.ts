import catalogoOficial from '../../../data/cnae/latest.json'

export interface CnaeOficialRecord {
  cnae: string
  descricao: string
  secao: string
}

const CNAES_OFICIAIS = catalogoOficial.records as CnaeOficialRecord[]

export const CNAE_OFICIAL_INDEX: Map<string, CnaeOficialRecord> = new Map(
  CNAES_OFICIAIS.map(record => [record.cnae, record]),
)

export const CNAE_OFICIAL_TOTAL = catalogoOficial.total
export const CNAE_OFICIAL_FONTE = catalogoOficial.source

export function getOfficialCnaes() {
  return CNAES_OFICIAIS
}

export function getOfficialCnaeByCode(cnae: string) {
  return CNAE_OFICIAL_INDEX.get(cnae)
}
