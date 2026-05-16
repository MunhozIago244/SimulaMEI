export const SITE_NAME = 'SimulaMEI'
export const SITE_SHORT_NAME = 'SimulaMEI'
export const DEFAULT_SITE_URL = 'https://simulamei.com.br'
export const SITE_TITLE = 'SimulaMEI — Simule seu teto antes de estourar'
export const SITE_DESCRIPTION =
  'Simule teto MEI, Fator R e Anexo do Simples com dados reais do seu negócio. Descubra quando sair do MEI, qual regime custa menos e onde há economia fiscal.'
export const SITE_SHARE_HEADLINE = 'Simule teto MEI, Fator R e regime tributário em minutos'
export const SITE_SHARE_SUPPORT =
  'Base oficial de 1.331 CNAEs, radar de teto e oportunidades fiscais para MEI e contadores.'
export const SITE_KEYWORDS = [
  'simulador teto MEI 2026',
  'quando sair do MEI calculadora',
  'calcular Fator R online grátis',
  'MEI teto 2026 quanto posso faturar',
  'simulador Simples Nacional grátis',
  'MEI vai estourar o teto o que fazer',
  'calcular imposto MEI vs Simples',
  'teto MEI 130000 2026',
  'Fator R MEI Anexo III',
  'planejamento tributário MEI contador',
  'CNAE MEI simulador',
  'Simples Nacional Fator R',
  'simulador tributário',
]

export interface LegalIdentity {
  entityName: string
  taxId: string | null
  contactEmail: string | null
  /** Single attribution line: "<Razão> · CNPJ <id>" or "Operado por <nome>". */
  line: string
}

/**
 * Resolves the public legal identity from configured values.
 *
 * Trust requirement: a fiscal product must say who operates it. We never
 * fabricate a CNPJ — when no tax id is configured we degrade honestly to
 * "Operado por <nome>" instead of inventing a company.
 */
export function resolveLegalIdentity(env?: {
  name?: string | null
  taxId?: string | null
  email?: string | null
}): LegalIdentity {
  const entityName = (env?.name ?? '').trim() || SITE_NAME
  const taxId = (env?.taxId ?? '').trim() || null
  const contactEmail = (env?.email ?? '').trim() || null
  const line = taxId
    ? `${entityName} · CNPJ ${taxId}`
    : `Operado por ${entityName}`

  return { entityName, taxId, contactEmail, line }
}

/** Legal identity resolved from environment (set NEXT_PUBLIC_LEGAL_* in prod). */
export function getLegalIdentity(): LegalIdentity {
  return resolveLegalIdentity({
    name: process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME,
    taxId: process.env.NEXT_PUBLIC_LEGAL_TAX_ID,
    email: process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL,
  })
}

/**
 * Canonical origin for metadata, robots and sitemap.
 *
 * Production should set NEXT_PUBLIC_APP_URL to the public domain. Preview
 * deploys may intentionally keep the production canonical to avoid indexing
 * duplicate Vercel URLs.
 */
export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_SITE_URL).replace(/\/+$/, '')
}

export function getMetadataBase() {
  try {
    return new URL(getSiteUrl())
  } catch {
    return new URL(DEFAULT_SITE_URL)
  }
}
