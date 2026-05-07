'use client'

import { FormEvent, useState } from 'react'
import { ACCOUNTANT_CLIENT_RANGES, ACCOUNTANT_TOOL_OPTIONS } from '@/lib/accountant/leads'
import { captureProductEvent } from '@/lib/analytics/events'

type FormState = 'idle' | 'submitting' | 'sent'

const fieldStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '11px 12px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border2)',
  background: 'var(--bg2)',
  color: 'var(--text1)',
  outline: 'none',
  fontSize: 14,
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'block',
        marginBottom: 7,
        color: 'var(--text2)',
        fontSize: 12,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: 0,
      }}
    >
      {children}
    </label>
  )
}

export function AccountantLeadForm({ source = 'para-contadores' }: { source?: string }) {
  const [state, setState] = useState<FormState>('idle')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nomeEscritorio: '',
    email: '',
    telefone: '',
    carteiraRange: '21-50',
    ferramentaAtual: 'Planilha',
    consentimentoLgpd: false,
  })

  function setValue(name: keyof typeof form, value: string | boolean) {
    setForm(current => ({ ...current, [name]: value }))
    setError('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setState('submitting')

    const response = await fetch('/api/accountant-leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const payload = await response.json().catch(() => null) as { error?: string } | null

    if (!response.ok) {
      setState('idle')
      setError(payload?.error ?? 'Não foi possível registrar o interesse agora.')
      return
    }

    captureProductEvent('accountant_signup_interest', {
      source,
      carteira_range: form.carteiraRange,
      ferramenta_atual: form.ferramentaAtual,
    })
    setState('sent')
  }

  if (state === 'sent') {
    return (
      <div style={{
        border: '1px solid rgba(200,241,53,0.26)',
        background: 'rgba(200,241,53,0.08)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
      }}>
        <div style={{ fontSize: 20, marginBottom: 8 }}>✓</div>
        <div style={{ color: 'var(--lime)', fontWeight: 800, marginBottom: 6 }}>
          Cadastro recebido!
        </div>
        <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>
          Recebemos seu cadastro. Contato em até 48h conforme a faixa de carteira.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
      <div>
        <Label htmlFor="accountant-office-name">Nome do escritório</Label>
        <input
          id="accountant-office-name"
          value={form.nomeEscritorio}
          onChange={event => setValue('nomeEscritorio', event.target.value)}
          placeholder="Ex.: Prime Contabilidade"
          required
          style={fieldStyle}
        />
      </div>

      <div>
        <Label htmlFor="accountant-email">E-mail profissional</Label>
        <input
          id="accountant-email"
          type="email"
          value={form.email}
          onChange={event => setValue('email', event.target.value)}
          placeholder="contato@escritorio.com.br"
          required
          style={fieldStyle}
        />
      </div>

      <div>
        <Label htmlFor="accountant-phone">WhatsApp</Label>
        <input
          id="accountant-phone"
          value={form.telefone}
          onChange={event => setValue('telefone', event.target.value)}
          placeholder="(11) 99999-9999"
          style={fieldStyle}
        />
      </div>

      <div className="accountant-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <Label htmlFor="accountant-client-range">Carteira MEI</Label>
          <select
            id="accountant-client-range"
            value={form.carteiraRange}
            onChange={event => setValue('carteiraRange', event.target.value)}
            style={fieldStyle}
          >
            {ACCOUNTANT_CLIENT_RANGES.map(range => (
              <option key={range} value={range}>{range} clientes</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="accountant-tool">Controle atual</Label>
          <select
            id="accountant-tool"
            value={form.ferramentaAtual}
            onChange={event => setValue('ferramentaAtual', event.target.value)}
            style={fieldStyle}
          >
            {ACCOUNTANT_TOOL_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <label htmlFor="accountant-consent" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
        <input
          id="accountant-consent"
          type="checkbox"
          checked={form.consentimentoLgpd}
          onChange={event => setValue('consentimentoLgpd', event.target.checked)}
          style={{ marginTop: 3 }}
        />
        <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
          Concordo com a <a href="/privacidade" style={{ color: 'var(--lime)' }}>política de privacidade</a> e autorizo contato comercial sobre o plano contador.
        </span>
      </label>

      {error && <div style={{ color: 'var(--red)', fontSize: 12 }}>{error}</div>}

      <button
        type="submit"
        disabled={state === 'submitting'}
        style={{
          minHeight: 48,
          borderRadius: 'var(--radius)',
          background: 'var(--lime)',
          color: 'var(--ink-on-accent)',
          fontSize: 14,
          fontWeight: 900,
          opacity: state === 'submitting' ? 0.72 : 1,
        }}
      >
        {state === 'submitting' ? 'Registrando...' : 'Entrar na lista de acesso antecipado'}
      </button>
    </form>
  )
}
