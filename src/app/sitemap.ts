import type { MetadataRoute } from 'next'
import catalogoOficial from '../../data/cnae/latest.json'
import { getSiteUrl } from '@/constants/site'

interface CnaeCatalogRecord {
  cnae: string
}

const PUBLIC_PAGES = [
  { path: '/', changeFrequency: 'weekly' as const, priority: 1 },
  { path: '/cnae/6201-5%2F01', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/para-contadores', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/aprenda', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/api-docs', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/metodologia', changeFrequency: 'monthly' as const, priority: 0.6 },
  // /privacidade e /termos removidas: marcadas noindex (sinal de sitemap seria contraditório)
]

const LEARNING_PAGES = [
  { path: '/aprenda/fator-r', changeFrequency: 'monthly' as const, priority: 0.75 },
  { path: '/aprenda/quando-sair-do-mei', changeFrequency: 'monthly' as const, priority: 0.75 },
  { path: '/aprenda/diferenca-anexo-iii-e-v', changeFrequency: 'monthly' as const, priority: 0.75 },
  { path: '/aprenda/limite-mei-2026', changeFrequency: 'monthly' as const, priority: 0.75 },
  { path: '/aprenda/mei-estourou-o-teto', changeFrequency: 'monthly' as const, priority: 0.75 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const lastModified = new Date(catalogoOficial.generatedAt)
  const records = catalogoOficial.records as CnaeCatalogRecord[]

  const staticEntries: MetadataRoute.Sitemap = [...PUBLIC_PAGES, ...LEARNING_PAGES].map(page => ({
    url: `${siteUrl}${page.path}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))

  const cnaeEntries: MetadataRoute.Sitemap = records.map(record => ({
    url: `${siteUrl}/cnae/${encodeURIComponent(record.cnae)}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticEntries, ...cnaeEntries]
}
