// cnae.ts — Mapa de CNAEs → Anexo do Simples + elegibilidade ao Fator R
// TAX_RULE_VERSION: 'BR-MEI-SN-2026-04-28'

import type { CnaeInfo, Anexo } from '@/types/tributario'
import { FATOR_R_MINIMO } from './fatorR'
import { CURATED_CNAES, CURATED_CNAE_INDEX } from './cnae-curated'
import {
  getOfficialCnaes,
  getOfficialCnaeByCode,
  CNAE_OFICIAL_INDEX,
  type CnaeOficialRecord,
} from './cnae-oficial'

const CNAE_CODE_RE = /^\d{4}-\d\/\d{2}$/

export const CNAE_MAP: CnaeInfo[] = CURATED_CNAES
export { CNAE_OFICIAL_FONTE, CNAE_OFICIAL_TOTAL } from './cnae-oficial'

// Map indexado por CNAE para lookup O(1)
export const CNAE_INDEX: Map<string, CnaeInfo> = CURATED_CNAE_INDEX
const CNAES_OFICIAIS = getOfficialCnaes()

function inferirCategoriaOficial(record: CnaeOficialRecord): CnaeInfo['categoria'] {
  if (record.secao === 'G') return 'comercio'
  if (record.secao === 'C') return 'industria'
  if (record.secao === 'F') return 'construcao'
  return 'servicos'
}

function toCnaeInfo(record: CnaeOficialRecord): CnaeInfo {
  const curado = CNAE_INDEX.get(record.cnae)
  if (curado) return { ...curado, classificacaoTributaria: 'curada' }

  return {
    cnae: record.cnae,
    descricao: record.descricao,
    anexoPadrao: 'III',
    elegivelFatorR: false,
    categoria: inferirCategoriaOficial(record),
    classificacaoTributaria: 'pendente',
  }
}

export function normalizeCnaeCode(value: string): string {
  const trimmed = value.trim()
  const digits = trimmed.replace(/\D/g, '')

  if (digits.length === 7) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 5)}/${digits.slice(5)}`
  }

  return trimmed
}

export function isKnownCnaeCode(value: string): boolean {
  const normalized = normalizeCnaeCode(value)
  if (!CNAE_CODE_RE.test(normalized)) return false

  return CNAE_INDEX.has(normalized) || CNAE_OFICIAL_INDEX.has(normalized)
}

/**
 * Busca um CNAE pelo código. Retorna undefined se não encontrado.
 */
export function getCnae(cnae: string): CnaeInfo | undefined {
  const normalized = normalizeCnaeCode(cnae)
  const curado = CNAE_INDEX.get(normalized)
  if (curado) return curado

  const oficial = getOfficialCnaeByCode(normalized)
  return oficial ? toCnaeInfo(oficial) : undefined
}

/**
 * Busca CNAEs por termo de texto (descrição ou código).
 * Usado no CnaeAutocomplete.tsx.
 */
export function buscarCnaes(termo: string): CnaeInfo[] {
  const t = termo.toLowerCase().trim()
  if (!t) return CNAE_MAP.slice(0, 10) // top 10 padrão

  const curados = CNAE_MAP.filter(
    c =>
      c.descricao.toLowerCase().includes(t) ||
      c.cnae.includes(t) ||
      c.categoria.includes(t)
  )
  const oficiais = CNAES_OFICIAIS.filter(
    c =>
      !CNAE_INDEX.has(c.cnae) &&
      (c.descricao.toLowerCase().includes(t) || c.cnae.includes(t))
  ).map(toCnaeInfo)

  return [...curados, ...oficiais].slice(0, 15)
}

/**
 * Retorna o Anexo correto considerando elegibilidade ao Fator R.
 */
export function getAnexoEfetivo(cnae: string, fatorR: number): Anexo {
  const info = getCnae(cnae)
  if (!info) return 'III' // fallback conservador
  if (info.elegivelFatorR && fatorR >= FATOR_R_MINIMO) return 'III'
  return info.anexoPadrao
}

/**
 * Lista CNAEs mais comuns para o ICP primário (TI/consultoria/freela).
 */
export function getCnaesDestaque(): CnaeInfo[] {
  return CNAE_MAP.filter(c => c.categoria === 'ti_consultoria').slice(0, 8)
}

export type CnaeCategoria = CnaeInfo['categoria']

const CATEGORIA_ORDEM: CnaeCategoria[] = [
  'ti_consultoria',
  'servicos',
  'comercio',
  'construcao',
  'industria',
]

/**
 * Retorna CNAEs curados agrupados por categoria, na ordem exibida na UI.
 * Cada grupo tem no máximo `maxPorGrupo` itens.
 */
export function getCnaesAgrupados(maxPorGrupo = 6): Record<CnaeCategoria, CnaeInfo[]> {
  const result = {} as Record<CnaeCategoria, CnaeInfo[]>
  for (const cat of CATEGORIA_ORDEM) {
    result[cat] = CNAE_MAP.filter(c => c.categoria === cat).slice(0, maxPorGrupo)
  }
  return result
}
