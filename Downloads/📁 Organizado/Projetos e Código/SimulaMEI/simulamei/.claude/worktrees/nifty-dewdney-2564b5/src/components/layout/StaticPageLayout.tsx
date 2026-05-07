import Link from 'next/link'
import { TAX_RULE_VERSION } from '@/lib/tributario'

interface StaticPageLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function StaticPageLayout({ title, subtitle, children }: StaticPageLayoutProps) {
  const versionLabel = TAX_RULE_VERSION.replace('BR-MEI-SN-', 'v')
  const year = new Date().getFullYear()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg0)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        padding: '20px 40px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{
            width: 24, height: 24, background: 'var(--lime)',
            borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            </svg>
          </div>
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
      <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', padding: '60px 40px', width: '100%' }}>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, marginBottom: subtitle ? 12 : 40, lineHeight: 1.1 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 16, color: 'var(--text2)', marginBottom: 40, lineHeight: 1.6 }}>
            {subtitle}
          </p>
        )}
        <div style={{
          fontSize: 15, lineHeight: 1.8, color: 'var(--text2)',
        }}>
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
            <Link key={label} href={href} style={{ fontSize: 12, color: 'var(--text3)' }}>
              {label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
