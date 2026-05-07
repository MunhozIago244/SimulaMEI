'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type ResetState = 'idle' | 'loading' | 'sent' | 'error'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<ResetState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setState('loading')
    setErrorMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/atualizar-senha`,
    })

    if (error) {
      setErrorMessage(error.message)
      setState('error')
      return
    }

    setState('sent')
  }

  return (
    <main style={{
      minHeight: '100vh', background: 'var(--bg0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <section style={{
        width: '100%', maxWidth: 420,
        background: 'var(--bg1)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '36px 40px',
      }}>
        <Link href="/auth/login" style={{ color: 'var(--lime)', fontSize: 13, textDecoration: 'none' }}>
          Voltar para entrar
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '22px 0 8px' }}>
          Recuperar senha
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 24 }}>
          Informe seu e-mail e enviaremos um link seguro para redefinir a senha da sua conta.
        </p>

        {state === 'sent' ? (
          <div style={{
            padding: 16, background: 'rgba(200,241,53,0.08)',
            border: '1px solid rgba(200,241,53,0.2)',
            borderRadius: 'var(--radius)', color: 'var(--lime)', fontSize: 14,
          }}>
            Link enviado. Confira sua caixa de entrada e spam.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <label htmlFor="recover-email" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>
              E-mail
            </label>
            <input
              id="recover-email"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              required
              placeholder="voce@email.com"
              style={{
                width: '100%', padding: '11px 12px',
                background: 'var(--bg2)', border: '1px solid var(--border2)',
                borderRadius: 'var(--radius)', color: 'var(--text1)',
                fontSize: 14, outline: 'none',
              }}
            />
            {state === 'error' && (
              <div style={{
                padding: '10px 12px', background: 'rgba(255,74,74,0.08)',
                border: '1px solid rgba(255,74,74,0.2)', borderRadius: 'var(--radius)',
                fontSize: 13, color: 'var(--red)',
              }}>
                {errorMessage}
              </div>
            )}
            <button
              type="submit"
              disabled={state === 'loading'}
              style={{
                padding: '12px 16px', background: 'var(--lime)', color: '#000',
                borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 800,
                cursor: state === 'loading' ? 'wait' : 'pointer',
                opacity: state === 'loading' ? 0.7 : 1,
              }}
            >
              {state === 'loading' ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
