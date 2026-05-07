import Link from 'next/link'
import { TAX_RULE_VERSION } from '@/lib/tributario'

const FOOTER_LINKS = [
  { label: 'Privacidade', href: '/privacidade' },
  { label: 'Termos',      href: '/termos' },
  { label: 'API',         href: '/api-docs' },
  { label: 'GitHub',      href: '/github' },
]

export function Footer() {
  const year = new Date().getFullYear()
  const versionLabel = TAX_RULE_VERSION.replace('BR-MEI-SN-', 'v')

  return (
    <footer
      style={{
        padding: '32px 40px',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 20, height: 20, background: 'var(--lime)',
          borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em' }}>
          Simula<span style={{ color: 'var(--lime)' }}>MEI</span>
        </span>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>— Motor tributário {versionLabel}</span>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {FOOTER_LINKS.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            style={{ fontSize: 12, color: 'var(--text3)', transition: 'color .15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
          >
            {label}
          </Link>
        ))}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text3)' }}>
        © {year} SimulaMEI. Não é consultoria tributária.
      </div>
    </footer>
  )
}
