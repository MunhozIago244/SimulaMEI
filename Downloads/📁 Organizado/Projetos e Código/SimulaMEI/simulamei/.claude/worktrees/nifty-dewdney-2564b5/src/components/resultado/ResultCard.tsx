'use client'

import { Tooltip } from '@/components/ui'

interface ResultCardProps {
  label: string
  value: string
  sub: string
  color: string
  tip?: string
}

export function ResultCard({ label, value, sub, color, tip }: ResultCardProps) {
  return (
    <div style={{
      background: 'var(--bg1)', border: '1px solid var(--border)',
      borderTop: `2px solid ${color}`,
      borderRadius: 'var(--radius-lg)', padding: '20px 22px',
      position: 'relative', overflow: 'hidden',
    }}>
      {tip ? (
        <Tooltip tip={tip}>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500, marginBottom: 10 }}>{label}</div>
        </Tooltip>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500, marginBottom: 10 }}>{label}</div>
      )}
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 700,
        color, marginBottom: 4, letterSpacing: '-0.02em',
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.4 }}>{sub}</div>
    </div>
  )
}
