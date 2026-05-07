import { getSiteUrl, SITE_NAME } from '@/constants/site'

interface ArticleJsonLdProps {
  path: string
  headline: string
  description: string
  dateModified?: string
}

export function ArticleJsonLd({
  path,
  headline,
  description,
  dateModified = '2026-05-07',
}: ArticleJsonLdProps) {
  const siteUrl = getSiteUrl()
  const url = `${siteUrl}${path}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    inLanguage: 'pt-BR',
    datePublished: '2026-05-07',
    dateModified,
    mainEntityOfPage: url,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: siteUrl,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
