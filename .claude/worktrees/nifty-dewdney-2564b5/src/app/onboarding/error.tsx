'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[onboarding] render error:', error)
  }, [error])

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg0)',
      color: 'var(--text1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <section style={{
        width: '100%',
        maxWidth: 520,
        background: 'var(--bg1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px 34px',
      }}>
        <p style={{ color: 'var(--yellow)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>
          Pré-cadastro indisponível
        </p>
        <h1 style={{ fontSize: 28, lineHeight: 1.05, margin: '0 0 10px' }}>
          Não consegui abrir seu fluxo de cadastro agora.
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7, margin: '0 0 24px' }}>
          Tente recarregar. Se continuar falhando, volte ao início e entre novamente.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '11px 14px',
              borderRadius: 'var(--radius)',
              background: 'var(--lime)',
              color: '#000',
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            Tentar de novo
          </button>
          <Link
            href="/auth/login?next=/onboarding"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '11px 14px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              color: 'var(--text2)',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Voltar ao login
          </Link>
        </div>
      </section>
    </main>
  )
}
