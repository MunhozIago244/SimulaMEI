'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type DeleteState = 'idle' | 'loading' | 'error'

const DELETE_CONFIRMATION = 'EXCLUIR'

export function DeleteAccountSection() {
  const router = useRouter()
  const [state, setState] = useState<DeleteState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      'Isso remove sua conta, chaves de API, simulações salvas e vínculos de leads. Esta ação não pode ser desfeita.',
    )

    if (!confirmed) return

    const typed = window.prompt(`Digite ${DELETE_CONFIRMATION} para confirmar a exclusão da conta.`)
    if (typed !== DELETE_CONFIRMATION) return

    setState('loading')
    setErrorMessage('')

    const response = await fetch('/api/account/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmation: DELETE_CONFIRMATION }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null
      setErrorMessage(payload?.error ?? 'Não foi possível excluir a conta agora.')
      setState('error')
      return
    }

    await createClient().auth.signOut()
    router.replace('/')
    router.refresh()
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
        Exclui o perfil, simulações salvas, API keys e leads vinculados ao seu e-mail.
      </p>

      {state === 'error' && errorMessage && (
        <div style={{
          padding: '10px 12px',
          background: 'rgba(255,74,74,0.08)',
          border: '1px solid rgba(255,74,74,0.2)',
          borderRadius: 'var(--radius)',
          color: 'var(--red)',
          fontSize: 13,
        }}>
          {errorMessage}
        </div>
      )}

      <button
        type="button"
        onClick={handleDeleteAccount}
        disabled={state === 'loading'}
        style={{
          justifySelf: 'start',
          padding: '11px 14px',
          borderRadius: 'var(--radius)',
          border: '1px solid rgba(255,74,74,0.28)',
          background: 'rgba(255,74,74,0.08)',
          color: 'var(--red)',
          fontSize: 13,
          fontWeight: 800,
          cursor: state === 'loading' ? 'wait' : 'pointer',
          opacity: state === 'loading' ? 0.7 : 1,
        }}
      >
        {state === 'loading' ? 'Excluindo conta...' : 'Excluir conta'}
      </button>
    </div>
  )
}
