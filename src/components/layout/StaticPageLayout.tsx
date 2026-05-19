import Link from 'next/link'
import { TAX_RULE_VERSION } from '@/lib/tributario'
import { BrandMark } from '@/components/brand/BrandMark'

interface StaticPageLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function StaticPageLayout({ title, subtitle, children }: StaticPageLayoutProps) {
  const versionLabel = TAX_RULE_VERSION.replace('BR-MEI-SN-', 'v')
  const year = new Date().getFullYear()

  return (
    <div className="site-shell" style={{ minHeight: '100vh', background: 'var(--bg0)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        padding: '18px 40px',
        borderBottom: '1px solid var(--border)',
        background: 'color-mix(in oklch, var(--bg0) 88%, transparent)',
        backdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <BrandMark size={24} />
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em' }}>
            Simula<span style={{ color: 'var(--lime)' }}>MEI</span>
          </span>
        </Link>
        <Link href="/" style={{
          fontSize: 13, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Voltar ao simulador
        </Link>
      </header>

      {/* Content */}
      <main className="section-shell" style={{ flex: 1, paddingTop: 68, paddingBottom: 78, width: '100%' }}>
        <div className="im-section-header">
          <span className="im-section-number">Guia fiscal</span>
          <div>
            <h1 className="im-section-title">
              {title}
            </h1>
            {subtitle && (
              <p className="im-section-lead">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div
          className="instrument-panel"
          style={{
            maxWidth: 840,
            margin: '0 auto',
            padding: 'clamp(24px, 4vw, 44px)',
            fontSize: 15,
            lineHeight: 1.82,
            color: 'var(--text2)',
          }}
        >
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '24px 40px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          © {year} SimulaMEI · Motor tributário {versionLabel}
        </span>
        <div style={{ display: 'flex', gap: 16 }}>
          {[['Privacidade', '/privacidade'], ['Termos', '/termos'], ['API', '/api-docs'], ['GitHub', '/github']].map(([label, href]) => (
            <Link key={label} href={href} style={{ fontSize: 12, color: 'var(--text2)' }}>
              {label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
