import catalogoOficial from '../../../../data/cnae/latest.json'
import type { EvidenciaFiscal } from './types'

export const FONTES_FISCAIS = {
  conclaCnae23: {
    fonteId: 'concla-ibge-cnae-2-3-subclasses',
    titulo: 'IBGE/CONCLA - CNAE 2.3 Subclasses',
    url: catalogoOficial.source.pageUrl,
    tipo: 'catalogo_oficial',
    hashSha256: catalogoOficial.source.hashSha256,
    acessadoEm: catalogoOficial.source.fetchedAt,
  },
  simplesNacionalLegislacao: {
    fonteId: 'simples-nacional-legislacao',
    titulo: 'Portal do Simples Nacional - legislacao',
    url: 'https://www8.receita.fazenda.gov.br/SimplesNacional/ConteudoApoio/Legislacao/TelaLegislacao.aspx',
    tipo: 'norma',
  },
  resolucaoCgsn140: {
    fonteId: 'resolucao-cgsn-140-2018',
    titulo: 'Resolucao CGSN n. 140/2018',
    url: 'https://www8.receita.fazenda.gov.br/SimplesNacional/',
    tipo: 'norma',
    observacao: 'Fonte normativa usada para tabelas e regras do Simples Nacional; manter monitoramento por ato oficial.',
  },
} satisfies Record<string, EvidenciaFiscal>
