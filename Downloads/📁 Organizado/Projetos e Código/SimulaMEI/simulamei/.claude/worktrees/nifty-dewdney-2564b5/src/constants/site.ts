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
  'MEI',
  'Simples Nacional',
  'Fator R',
  'teto MEI',
  'simulador tributário',
  'CNAE',
  'planejamento tributário',
]

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
