'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OfficeClientRecord } from '@/lib/accountant/server'

interface OfficeClientActionsProps {
  client: OfficeClientRecord
}

export function OfficeClientActions({ client }: OfficeClientActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(action: 'pause' | 'reactivate') {
    setLoading(true)
    setError('')

    const response = await fetch(`/api/accountant/clients/${client.id}`, {
      method: action === 'pause' ? 'DELETE' : 'PATCH',
      headers: action === 'reactivate' ? { 'content-type': 'application/json' } : undefined,
      body: action === 'reactivate' ? JSON.stringify({ ativo: true }) : undefined,
    })
    const data = await response.json()

    if (!response.ok) {
      setError(data.error ?? 'Não foi possível atualizar o cliente.')
      setLoading(false)
      return
    }

    router.refresh()
    setLoading(false)
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {client.ativo ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => submit('pause')}
          style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg2)', color: 'var(--text1)', padding: '10px 12px', fontWeight: 850, cursor: loading ? 'wait' : 'pointer' }}
        >
          Pausar cliente
        </button>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={() => submit('reactivate')}
          style={{ border: 0, borderRadius: 'var(--radius)', background: 'var(--lime)', color: 'var(--ink-on-accent)', padding: '10px 12px', fontWeight: 950, cursor: loading ? 'wait' : 'pointer' }}
        >
          Reativar cliente
        </button>
      )}
      {error ? <div role="alert" style={{ color: '#ffb4b4', fontSize: 13 }}>{error}</div> : null}
    </div>
  )
}
