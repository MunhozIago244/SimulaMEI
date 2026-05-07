import { BRAZIL_UF_OPTIONS } from '@/constants/onboarding'
import { isKnownCnaeCode, normalizeCnaeCode } from '@/lib/tributario/cnae'
import { normalizeBoundedText, normalizeEmail } from '@/lib/validation'

export const OFFICE_CLIENT_STATUS_FILTERS = ['all', 'active', 'inactive', 'manual', 'plan_limit'] as const
export const OFFICE_CLIENT_PAGE_SIZE = 20

export type OfficeClientStatusFilter = typeof OFFICE_CLIENT_STATUS_FILTERS[number]
export type OfficeClientTipoMei = 'geral' | 'caminhoneiro'

export interface OfficeClientPayload {
  nome?: unknown
  email?: unknown
  cnae?: unknown
  tipoMei?: unknown
  uf?: unknown
  municipio?: unknown
  observacoes?: unknown
}

export interface NormalizedOfficeClient {
  nome: string
  email: string | null
  cnae: string
  tipoMei: OfficeClientTipoMei
  uf: string | null
  municipio: string | null
  observacoes: string | null
}

export type NormalizedOfficeClientUpdate = Partial<NormalizedOfficeClient> & { ativo?: boolean }

export type OfficeClientCreateResult =
  | { ok: true; value: NormalizedOfficeClient }
  | { ok: false; error: string }

export type OfficeClientUpdateResult =
  | { ok: true; value: NormalizedOfficeClientUpdate }
  | { ok: false; error: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_UFS = new Set<string>(BRAZIL_UF_OPTIONS)
const VALID_TIPO_MEI = new Set<OfficeClientTipoMei>(['geral', 'caminhoneiro'])

function optionalText(value: unknown, maxLength: number) {
  const normalized = normalizeBoundedText(value ?? '', maxLength)
  if (normalized === null) return null
  return normalized || null
}

function normalizeClientEmail(value: unknown) {
  const normalized = normalizeEmail(value ?? '')
  if (!normalized) return { ok: true as const, value: null }
  if (!EMAIL_RE.test(normalized)) {
    return { ok: false as const, error: 'E-mail inválido.' }
  }
  return { ok: true as const, value: normalized }
}

function normalizeClientCnae(value: unknown) {
  if (typeof value !== 'string') {
    return { ok: false as const, error: 'Informe um CNAE oficial válido.' }
  }

  const cnae = normalizeCnaeCode(value)
  if (!isKnownCnaeCode(cnae)) {
    return { ok: false as const, error: 'Informe um CNAE oficial válido.' }
  }

  return { ok: true as const, value: cnae }
}

function normalizeTipoMei(value: unknown) {
  const tipoMei = typeof value === 'string' ? value.trim() : 'geral'
  if (!VALID_TIPO_MEI.has(tipoMei as OfficeClientTipoMei)) {
    return { ok: false as const, error: 'Tipo de MEI inválido.' }
  }
  return { ok: true as const, value: tipoMei as OfficeClientTipoMei }
}

function normalizeUf(value: unknown) {
  const uf = optionalText(value, 2)?.toUpperCase() ?? null
  if (uf && !VALID_UFS.has(uf)) {
    return { ok: false as const, error: 'UF inválida.' }
  }
  return { ok: true as const, value: uf }
}

export function normalizeOfficeClientCreate(payload: OfficeClientPayload): OfficeClientCreateResult {
  const nome = normalizeBoundedText(payload.nome, 160)
  if (!nome) {
    return { ok: false, error: 'Informe o nome do cliente.' }
  }

  const email = normalizeClientEmail(payload.email)
  if (!email.ok) return email

  const cnae = normalizeClientCnae(payload.cnae)
  if (!cnae.ok) return cnae

  const tipoMei = normalizeTipoMei(payload.tipoMei)
  if (!tipoMei.ok) return tipoMei

  const uf = normalizeUf(payload.uf)
  if (!uf.ok) return uf

  return {
    ok: true,
    value: {
      nome,
      email: email.value,
      cnae: cnae.value,
      tipoMei: tipoMei.value,
      uf: uf.value,
      municipio: optionalText(payload.municipio, 120),
      observacoes: optionalText(payload.observacoes, 600),
    },
  }
}

export function normalizeOfficeClientUpdate(payload: OfficeClientPayload & { ativo?: unknown }): OfficeClientUpdateResult {
  const value: NormalizedOfficeClientUpdate = {}

  if ('nome' in payload) {
    const nome = normalizeBoundedText(payload.nome, 160)
    if (!nome) return { ok: false, error: 'Informe o nome do cliente.' }
    value.nome = nome
  }

  if ('email' in payload) {
    const email = normalizeClientEmail(payload.email)
    if (!email.ok) return email
    value.email = email.value
  }

  if ('cnae' in payload) {
    const cnae = normalizeClientCnae(payload.cnae)
    if (!cnae.ok) return cnae
    value.cnae = cnae.value
  }

  if ('tipoMei' in payload) {
    const tipoMei = normalizeTipoMei(payload.tipoMei)
    if (!tipoMei.ok) return tipoMei
    value.tipoMei = tipoMei.value
  }

  if ('uf' in payload) {
    const uf = normalizeUf(payload.uf)
    if (!uf.ok) return uf
    value.uf = uf.value
  }

  if ('municipio' in payload) {
    value.municipio = optionalText(payload.municipio, 120)
  }

  if ('observacoes' in payload) {
    value.observacoes = optionalText(payload.observacoes, 600)
  }

  if ('ativo' in payload) {
    if (typeof payload.ativo !== 'boolean') {
      return { ok: false, error: 'Status do cliente inválido.' }
    }
    value.ativo = payload.ativo
  }

  if (Object.keys(value).length === 0) {
    return { ok: false, error: 'Informe ao menos um campo para atualizar.' }
  }

  return { ok: true, value }
}

export function isOfficeClientStatusFilter(value: string | null): value is OfficeClientStatusFilter {
  return OFFICE_CLIENT_STATUS_FILTERS.includes((value ?? 'all') as OfficeClientStatusFilter)
}

export function normalizeOfficeClientStatusFilter(value: string | null | undefined): OfficeClientStatusFilter {
  const status = value ?? 'all'
  return isOfficeClientStatusFilter(status) ? status : 'all'
}
