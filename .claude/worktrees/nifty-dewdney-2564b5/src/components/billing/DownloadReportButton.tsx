'use client'

import { captureProductEvent } from '@/lib/analytics/events'

export function DownloadReportButton() {
  return (
    <button
      type="button"
      onClick={() => {
        captureProductEvent('pdf_cta_clicked', { source: 'report-page' })
        window.location.href = '/api/relatorio/gerar'
      }}
      style={{
        minHeight: 44,
        padding: '0 16px',
        borderRadius: 'var(--radius)',
        background: 'var(--lime)',
        color: '#000',
        fontSize: 14,
        fontWeight: 800,
      }}
    >
      Baixar PDF agora
    </button>
  )
}
