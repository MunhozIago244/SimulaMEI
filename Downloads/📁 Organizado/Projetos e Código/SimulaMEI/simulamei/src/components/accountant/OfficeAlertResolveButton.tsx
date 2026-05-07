'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function OfficeAlertResolveButton({ alertId }: { alertId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function resolveAlert() {
    setLoading(true)
    setError('')

    const response = await fetch(`/api/accountant/alerts/${alertId}/resolve`, {
      method: 'PATCH',
    })
    const payload = await response.json().catch(() => null) as { error?: string } | null

    if (!response.ok) {
      setLoading(false)
      setError(payload?.error ?? 'Não foi possível resolver o alerta.')
      return
    }

    router.refresh()
  }

  return (
    <div style={{ display: 'grid', gap: 6, justifyItems: 'start' }}>
      <button
        type="button"
        onClick={resolveAlert}
        disabled={loading}
        style={{
          minHeight: 34,
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          background: 'var(--bg2)',
          color: 'var(--text1)',
          padding: '0 11px',
          fontSize: 12,
          fontWeight: 900,
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Resolvendo...' : 'Marcar resolvido'}
      </button>
      {error ? (
        <span role="alert" style={{ color: 'var(--red)', fontSize: 12 }}>
          {error}
        </span>
      ) : null}
    </div>
  )
}
