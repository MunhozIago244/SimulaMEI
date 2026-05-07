'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type UpdateState = 'checking' | 'idle' | 'loading' | 'success' | 'error'

function AtualizarSenhaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [state, setState] = useState<UpdateState>('checking')
  const [errorMessage, setErrorMessage] = useState('')
  const recoveryLinkInvalid =
    errorMessage === 'O link de recuperação expirou ou já foi utilizado.' ||
    errorMessage === 'Abra o link de recuperação enviado por e-mail para definir uma nova senha.'

  useEffect(() => {
    let active = true

    async function prepareRecoverySession() {
      const supabase = createClient()
      const code = searchParams.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!active) return

        if (error) {
          setErrorMessage('O link de recuperação expirou ou já foi utilizado.')
          setState('error')
          return
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!active) return

      if (!session) {
        setErrorMessage('Abra o link de recuperação enviado por e-mail para definir uma nova senha.')
        setState('error')
        return
      }

      setState('idle')
    }

    prepareRecoverySession()

    return () => {
      active = false
    }
  }, [searchParams])

  useEffect(() => {
    if (state !== 'success') return

    const timeoutId = window.setTimeout(() => {
      router.replace('/dashboard')
      router.refresh()
    }, 1200)

    return () => window.clearTimeout(timeoutId)
  }, [router, state])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrorMessage('')

    if (senha.length < 8) {
      setErrorMessage('Use uma senha com pelo menos 8 caracteres.')
      setState('error')
      return
    }

    if (senha !== confirmacao) {
      setErrorMessage('As senhas informadas não conferem.')
      setState('error')
      return
    }

    setState('loading')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })

    if (error) {
      setErrorMessage(error.message)
      setState('error')
      return
    }

    setState('success')
  }

  return (
    <main style={{
      minHeight: '100vh', background: 'var(--bg0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <section style={{
        width: '100%', maxWidth: 440,
        background: 'var(--bg1)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '36px 40px',
      }}>
        <Link href="/auth/login" style={{ color: 'var(--lime)', fontSize: 13, textDecoration: 'none' }}>
          Voltar para entrar
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '22px 0 8px' }}>
          Definir nova senha
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 24 }}>
          Crie uma senha forte para proteger seu histórico de simulações e relatórios fiscais.
        </p>

        {state === 'checking' && (
          <div style={{
            padding: 16, background: 'var(--bg2)',
            border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
            color: 'var(--text2)', fontSize: 14,
          }}>
            Validando link seguro...
          </div>
        )}

        {state === 'success' ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{
              padding: 16, background: 'rgba(200,241,53,0.08)',
              border: '1px solid rgba(200,241,53,0.2)',
              borderRadius: 'var(--radius)', color: 'var(--lime)', fontSize: 14,
            }}>
              Senha atualizada com sucesso. Redirecionando...
            </div>
            <Link
              href="/dashboard"
              style={{
                display: 'block', textAlign: 'center',
                padding: '12px 16px', background: 'var(--lime)', color: '#000',
                borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              Ir para o painel
            </Link>
          </div>
        ) : recoveryLinkInvalid ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{
              padding: '10px 12px', background: 'rgba(255,74,74,0.08)',
              border: '1px solid rgba(255,74,74,0.2)', borderRadius: 'var(--radius)',
              fontSize: 13, color: 'var(--red)',
            }}>
              {errorMessage}
            </div>
            <Link
              href="/auth/recuperar"
              style={{
                display: 'block', textAlign: 'center',
                padding: '12px 16px', background: 'var(--bg2)', color: 'var(--text1)',
                border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
              }}
            >
              Solicitar novo link
            </Link>
          </div>
        ) : state !== 'checking' && (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <label htmlFor="update-password-new" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>
              Nova senha
            </label>
            <input
              id="update-password-new"
              type="password"
              value={senha}
              onChange={event => setSenha(event.target.value)}
              required
              minLength={8}
              placeholder="Mínimo de 8 caracteres"
              style={{
                width: '100%', padding: '11px 12px',
                background: 'var(--bg2)', border: '1px solid var(--border2)',
                borderRadius: 'var(--radius)', color: 'var(--text1)',
                fontSize: 14, outline: 'none',
              }}
            />

            <label htmlFor="update-password-confirm" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>
              Confirmar senha
            </label>
            <input
              id="update-password-confirm"
              type="password"
              value={confirmacao}
              onChange={event => setConfirmacao(event.target.value)}
              required
              minLength={8}
              placeholder="Repita a nova senha"
              style={{
                width: '100%', padding: '11px 12px',
                background: 'var(--bg2)', border: '1px solid var(--border2)',
                borderRadius: 'var(--radius)', color: 'var(--text1)',
                fontSize: 14, outline: 'none',
              }}
            />

            {state === 'error' && errorMessage && (
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
              {state === 'loading' ? 'Atualizando...' : 'Atualizar senha'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}

export default function AtualizarSenhaPage() {
  return (
    <Suspense fallback={
      <main style={{
        minHeight: '100vh', background: 'var(--bg0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text2)', fontSize: 14,
      }}>
        Carregando...
      </main>
    }>
      <AtualizarSenhaForm />
    </Suspense>
  )
}
