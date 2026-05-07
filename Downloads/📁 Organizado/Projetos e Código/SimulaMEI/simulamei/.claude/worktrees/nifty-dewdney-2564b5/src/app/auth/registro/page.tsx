'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getOAuthErrorMessage, getSignupSubmissionFeedback } from '@/lib/auth/messages'

type AuthStep = 'idle' | 'loading' | 'error' | 'success'

export default function RegistroPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [step, setStep] = useState<AuthStep>('idle')
  const [erro, setErro] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setSuccessMessage('')

    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      setStep('error')
      return
    }
    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.')
      setStep('error')
      return
    }

    setStep('loading')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })

    if (data.session) {
      router.push('/dashboard')
      router.refresh()
      return
    }

    const feedback = getSignupSubmissionFeedback(error?.message)
    if (feedback.status === 'error') {
      setErro(feedback.message)
      setStep('error')
      return
    }

    setSuccessMessage(feedback.message)
    setStep('success')
  }

  async function handleGoogleLogin() {
    setErro('')
    setSuccessMessage('')
    setStep('loading')
    setIsGoogleLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    })

    if (error) {
      setErro(getOAuthErrorMessage(error.message))
      setStep('error')
      setIsGoogleLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg0)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          width: '100%', maxWidth: 420, textAlign: 'center',
          background: 'var(--bg1)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '48px 40px',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(200,241,53,0.12)', border: '2px solid var(--lime)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Verifique seu e-mail</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>
            {successMessage}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 28 }}>
            Confira sua caixa de entrada e a pasta de spam para concluir o acesso.
          </p>
          <Link
            href="/auth/login"
            style={{
              display: 'inline-block', padding: '10px 24px',
              background: 'var(--bg2)', border: '1px solid var(--border2)',
              borderRadius: 'var(--radius)', fontSize: 14, color: 'var(--text1)',
            }}
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    )
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
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Criar conta grátis</h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 28 }}>
          Salve suas simulações e acesse relatórios completos.
        </p>

        {/* Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          disabled={step === 'loading' || isGoogleLoading}
          style={{
            width: '100%', padding: '11px 16px',
            background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: 'var(--radius)', color: 'var(--text1)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            marginBottom: 24, transition: 'border-color .15s',
            opacity: step === 'loading' || isGoogleLoading ? 0.7 : 1,
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>ou com e-mail</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="register-email" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
              E-mail
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="você@email.com"
              style={{
                width: '100%', padding: '10px 12px',
                background: 'var(--bg2)', border: '1px solid var(--border2)',
                borderRadius: 'var(--radius)', color: 'var(--text1)',
                fontSize: 14, outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--lime)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
            />
          </div>

          <div>
            <label htmlFor="register-password" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
              Senha
            </label>
            <input
              id="register-password"
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              placeholder="Mínimo 8 caracteres"
              style={{
                width: '100%', padding: '10px 12px',
                background: 'var(--bg2)', border: '1px solid var(--border2)',
                borderRadius: 'var(--radius)', color: 'var(--text1)',
                fontSize: 14, outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--lime)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
            />
          </div>

          <div>
            <label htmlFor="register-password-confirm" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
              Confirmar senha
            </label>
            <input
              id="register-password-confirm"
              type="password"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 12px',
                background: 'var(--bg2)',
                border: `1px solid ${confirmar && confirmar !== senha ? 'var(--red)' : 'var(--border2)'}`,
                borderRadius: 'var(--radius)', color: 'var(--text1)',
                fontSize: 14, outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--lime)')}
              onBlur={e => (e.currentTarget.style.borderColor = confirmar && confirmar !== senha ? 'var(--red)' : 'var(--border2)')}
            />
            {confirmar && confirmar !== senha && (
              <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>Senhas não coincidem</p>
            )}
          </div>

          {step === 'error' && erro && (
            <div style={{
              padding: '10px 12px', background: 'rgba(255,74,74,0.08)',
              border: '1px solid rgba(255,74,74,0.2)', borderRadius: 'var(--radius)',
              fontSize: 13, color: 'var(--red)',
            }}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={step === 'loading' || isGoogleLoading}
            style={{
              width: '100%', padding: '12px 16px',
              background: 'var(--lime)', color: '#000',
              borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 700,
              cursor: step === 'loading' || isGoogleLoading ? 'wait' : 'pointer',
              opacity: step === 'loading' || isGoogleLoading ? 0.7 : 1,
              marginTop: 4,
            }}
          >
            {step === 'loading' ? 'Criando conta…' : 'Criar conta grátis'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 20, lineHeight: 1.6 }}>
          Ao criar uma conta, você concorda com os{' '}
          <Link href="/termos" style={{ color: 'var(--text2)' }}>Termos de Uso</Link>
          {' '}e a{' '}
          <Link href="/privacidade" style={{ color: 'var(--text2)' }}>Política de Privacidade</Link>.
        </p>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)', marginTop: 16 }}>
          Já tem conta?{' '}
          <Link href="/auth/login" style={{ color: 'var(--lime)', fontWeight: 600 }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
