'use client'

import { useState, FormEvent, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  getLoginErrorFeedback,
  getLoginQueryFeedback,
  getOAuthErrorMessage,
} from '@/lib/auth/messages'

type AuthStep = 'idle' | 'loading' | 'error' | 'success'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams.get('next') ?? '/dashboard'
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/'
  const queryErrorMessage = getLoginQueryFeedback(searchParams.get('error'))

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [step, setStep] = useState<AuthStep>('idle')
  const [erro, setErro] = useState('')
  const [allowResendConfirmation, setAllowResendConfirmation] = useState(false)
  const [infoMessage, setInfoMessage] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false)
  const visibleError = erro || (step === 'idle' ? queryErrorMessage ?? '' : '')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStep('loading')
    setErro('')
    setInfoMessage('')
    setAllowResendConfirmation(false)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      const feedback = getLoginErrorFeedback(error.message)
      setErro(feedback.message)
      setAllowResendConfirmation(Boolean(feedback.allowResendConfirmation))
      setStep('error')
      return
    }

    setStep('success')
    router.push(next)
    router.refresh()
  }

  async function handleGoogleLogin() {
    setErro('')
    setInfoMessage('')
    setAllowResendConfirmation(false)
    setStep('loading')
    setIsGoogleLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })

    if (error) {
      setErro(getOAuthErrorMessage(error.message))
      setStep('error')
      setIsGoogleLoading(false)
    }
  }

  async function handleResendConfirmation() {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setErro('Informe o e-mail para reenviar a confirmação.')
      setStep('error')
      return
    }

    setIsResendingConfirmation(true)
    setInfoMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: trimmedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    if (error) {
      setErro('Não foi possível reenviar a confirmação agora. Tente novamente em instantes.')
      setStep('error')
      setIsResendingConfirmation(false)
      return
    }

    setInfoMessage('Se este e-mail estiver aguardando confirmação, um novo link foi enviado.')
    setIsResendingConfirmation(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg0)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40, textDecoration: 'none' }}>
        <div style={{
          width: 28, height: 28, background: 'var(--lime)',
          borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          </svg>
        </div>
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em' }}>
          Simula<span style={{ color: 'var(--lime)' }}>MEI</span>
        </span>
      </Link>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--bg1)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '36px 40px',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Entrar</h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 28 }}>
          Acesse seu histórico de simulações e relatórios.
        </p>

        {/* Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          disabled={step === 'loading' || step === 'success' || isGoogleLoading}
          style={{
            width: '100%', padding: '11px 16px',
            background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: 'var(--radius)', color: 'var(--text1)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            marginBottom: 24, transition: 'border-color .15s',
            opacity: step === 'loading' || step === 'success' || isGoogleLoading ? 0.7 : 1,
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text3)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isGoogleLoading ? 'Redirecionando…' : 'Continuar com Google'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>ou com e-mail</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="login-email" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
              E-mail
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="você@email.com"
              style={{
                width: '100%', padding: '10px 12px',
                background: 'var(--bg2)', border: `1px solid ${visibleError ? 'var(--red)' : 'var(--border2)'}`,
                borderRadius: 'var(--radius)', color: 'var(--text1)',
                fontSize: 14, outline: 'none', transition: 'border-color .15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--lime)')}
              onBlur={e => (e.currentTarget.style.borderColor = visibleError ? 'var(--red)' : 'var(--border2)')}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label htmlFor="login-password" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Senha</label>
              <Link href="/auth/recuperar" style={{ fontSize: 12, color: 'var(--lime)', textDecoration: 'none' }}>
                Esqueci a senha
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 12px',
                background: 'var(--bg2)', border: `1px solid ${visibleError ? 'var(--red)' : 'var(--border2)'}`,
                borderRadius: 'var(--radius)', color: 'var(--text1)',
                fontSize: 14, outline: 'none', transition: 'border-color .15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--lime)')}
              onBlur={e => (e.currentTarget.style.borderColor = visibleError ? 'var(--red)' : 'var(--border2)')}
            />
          </div>

          {/* Erro */}
          {visibleError && (
            <div style={{
              padding: '10px 12px', background: 'rgba(255,74,74,0.08)',
              border: '1px solid rgba(255,74,74,0.2)', borderRadius: 'var(--radius)',
              fontSize: 13, color: 'var(--red)',
            }}>
              <div>{visibleError}</div>
              {allowResendConfirmation && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isResendingConfirmation}
                  style={{
                    marginTop: 10,
                    color: 'var(--lime)',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'underline',
                    opacity: isResendingConfirmation ? 0.7 : 1,
                  }}
                >
                  {isResendingConfirmation ? 'Reenviando...' : 'Reenviar confirmação'}
                </button>
              )}
            </div>
          )}

          {infoMessage && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(200,241,53,0.08)',
              border: '1px solid rgba(200,241,53,0.2)',
              borderRadius: 'var(--radius)',
              fontSize: 13,
              color: 'var(--lime)',
            }}>
              {infoMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={step === 'loading' || step === 'success' || isGoogleLoading}
            style={{
              width: '100%', padding: '12px 16px',
              background: 'var(--lime)', color: '#000',
              borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 700,
              cursor: step === 'loading' || isGoogleLoading ? 'wait' : 'pointer',
              opacity: step === 'loading' || isGoogleLoading ? 0.7 : 1,
              transition: 'opacity .15s',
              marginTop: 4,
            }}
          >
            {step === 'loading' ? 'Entrando…' : step === 'success' ? 'Redirecionando…' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)', marginTop: 24 }}>
          Não tem conta?{' '}
          <Link href="/auth/registro" style={{ color: 'var(--lime)', fontWeight: 600 }}>
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', background: 'var(--bg0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text2)', fontSize: 14,
      }}>
        Carregando...
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
