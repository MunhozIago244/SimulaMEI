import Link from 'next/link'
import type { ReactNode } from 'react'
import type { CurrentAccountantOffice } from '@/lib/accountant/server'

interface AccountantShellProps {
  office: CurrentAccountantOffice
  active: 'dashboard' | 'clients' | 'billing'
  children: ReactNode
}

const NAV_ITEMS = [
  { href: '/contador', label: 'Visão geral', key: 'dashboard' },
  { href: '/contador/clientes', label: 'Clientes', key: 'clients' },
  { href: '/contador/assinatura', label: 'Assinatura', key: 'billing' },
] as const

export function AccountantShell({ office, active, children }: AccountantShellProps) {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg0)', color: 'var(--text1)', padding: '30px 24px 64px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header className="accountant-shell-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start', marginBottom: 24 }}>
          <div>
            <Link href="/" className="quiet-link">
              Voltar ao SimulaMEI
            </Link>
            <h1 style={{ fontSize: 'clamp(30px, 5vw, 58px)', lineHeight: 0.98, margin: '16px 0 10px' }}>
              Painel contador
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.7 }}>
              {office.name} · {office.role} · Plano {office.plan.replace('_', ' ')}
            </p>
          </div>

          <Link
            href="/contador/clientes/novo"
            className="accountant-primary-action"
            style={{
              padding: '11px 15px',
              borderRadius: 'var(--radius)',
              fontSize: 13,
              fontWeight: 900,
              whiteSpace: 'nowrap',
              textDecoration: 'none',
            }}
          >
            Novo cliente
          </Link>
        </header>

        <nav aria-label="Navegação contador" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {NAV_ITEMS.map(item => {
            const isActive = item.key === active
            return (
              <Link
                key={item.href}
                href={item.href}
                className="accountant-nav-link"
                aria-current={isActive ? 'page' : undefined}
                style={{
                  padding: '9px 12px',
                  borderRadius: 999,
                  border: `1px solid ${isActive ? 'var(--lime)' : 'var(--border)'}`,
                  color: isActive ? 'var(--ink-on-accent)' : 'var(--text2)',
                  background: isActive ? 'var(--lime)' : 'var(--bg1)',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {office.admin_access_fallback ? (
          <div
            role="alert"
            style={{
              border: '1px solid rgba(255, 193, 7, .35)',
              background: 'rgba(255, 193, 7, .1)',
              color: 'var(--yellow)',
              borderRadius: 'var(--radius)',
              padding: 14,
              marginBottom: 18,
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            Acesso admin liberado, mas os dados do escritório estão em modo diagnóstico porque a conexão Supabase admin falhou
            {office.admin_access_error ? `: ${office.admin_access_error}` : '.'}
          </div>
        ) : null}

        {children}
      </div>
    </main>
  )
}
