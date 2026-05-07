import catalogoOficial from '../../../data/cnae/latest.json'
import { getCnae } from './cnae'

interface CnaeOficialRecord {
  cnae: string
  descricao: string
  secao: string
  divisao: string
  grupo: string
  classe: string
}

export interface CnaeDetalhe {
  cnae: string
  descricao: string
  classificacaoTributaria: 'curada' | 'pendente'
  hierarquia: {
    secao: string
    divisao: string
    grupo: string
    classe: string
  }
  fonte: {
    nome: string
    url: string
    hashSha256: string
    fetchedAt: string
  }
  perfilTributario: ReturnType<typeof getCnae> | null
}

const CNAES_OFICIAIS = catalogoOficial.records as CnaeOficialRecord[]

export function getCnaeDetalhe(codigo: string): CnaeDetalhe | null {
  const normalizado = codigo.trim()
  const oficial = CNAES_OFICIAIS.find(item => item.cnae === normalizado)
  if (!oficial) return null

  const perfilTributario = getCnae(normalizado) ?? null

  return {
    cnae: oficial.cnae,
    descricao: oficial.descricao,
    classificacaoTributaria: perfilTributario?.classificacaoTributaria === 'curada' ? 'curada' : 'pendente',
    hierarquia: {
      secao: oficial.secao,
      divisao: oficial.divisao,
      grupo: oficial.grupo,
      classe: oficial.classe,
    },
    fonte: {
      nome: catalogoOficial.source.name,
      url: catalogoOficial.source.pageUrl,
      hashSha256: catalogoOficial.source.hashSha256,
      fetchedAt: catalogoOficial.source.fetchedAt,
    },
    perfilTributario,
  }
}
