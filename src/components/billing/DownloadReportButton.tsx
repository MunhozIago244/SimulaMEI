'use client'

import { useState } from 'react'
import { captureProductEvent } from '@/lib/analytics/events'

export function DownloadReportButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  return (
    <div style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
      <button
        type="button"
        disabled={status === 'loading'}
        onClick={async () => {
          setStatus('loading')
          setError('')
          captureProductEvent('pdf_cta_clicked', { source: 'report-page' })

          const response = await fetch('/api/relatorio-premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          })

          if (!response.ok) {
            const payload = await response.json().catch(() => ({ error: 'Não foi possível gerar o relatório.' }))
            setError(payload.error ?? 'Não foi possível gerar o relatório.')
            setStatus('error')
            return
          }

          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = 'simulamei-relatorio-premium.pdf'
          document.body.appendChild(link)
          link.click()
          link.remove()
          window.URL.revokeObjectURL(url)
          setStatus('idle')
        }}
        style={{
          minHeight: 44,
          padding: '0 16px',
          borderRadius: 'var(--radius)',
          background: 'var(--lime)',
          color: 'var(--ink-on-accent)',
          fontSize: 14,
          fontWeight: 800,
          opacity: status === 'loading' ? 0.72 : 1,
        }}
      >
        {status === 'loading' ? 'Gerando com IA...' : 'Baixar PDF agora'}
      </button>
      {error && <span style={{ color: 'var(--red)', fontSize: 12 }}>{error}</span>}
    </div>
  )
}
