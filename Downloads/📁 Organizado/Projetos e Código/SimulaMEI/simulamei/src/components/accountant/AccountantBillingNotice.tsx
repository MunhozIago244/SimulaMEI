import Link from 'next/link'
import type { AccountantBillingState } from '@/lib/accountant/billing-state'

const TONE: Record<AccountantBillingState['severity'], { border: string; background: string; color: string }> = {
  ok: {
    border: 'rgba(220, 255, 80, .28)',
    background: 'rgba(220, 255, 80, .08)',
    color: 'var(--lime)',
  },
  info: {
    border: 'rgba(64, 169, 255, .3)',
    background: 'rgba(64, 169, 255, .08)',
    color: 'var(--blue)',
  },
  warn: {
    border: 'rgba(255, 193, 7, .35)',
    background: 'rgba(255, 193, 7, .1)',
    color: 'var(--yellow)',
  },
  danger: {
    border: 'rgba(255, 91, 91, .35)',
    background: 'rgba(255, 91, 91, .1)',
    color: 'var(--red)',
  },
}

interface AccountantBillingNoticeProps {
  state: AccountantBillingState
  compact?: boolean
}

export function AccountantBillingNotice({ state, compact = false }: AccountantBillingNoticeProps) {
  const tone = TONE[state.severity]

  return (
    <div
      role={state.restricted ? 'alert' : 'status'}
      style={{
        border: `1px solid ${tone.border}`,
        background: tone.background,
        borderRadius: 'var(--radius)',
        padding: compact ? 14 : 18,
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'start', flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: tone.color, fontSize: 12, fontWeight: 950, textTransform: 'uppercase', marginBottom: 6 }}>
            {state.statusLabel}
          </div>
          <strong style={{ color: 'var(--text1)', fontSize: compact ? 16 : 19 }}>{state.headline}</strong>
        </div>
        <Link
          href={state.actionHref}
          style={{
            minHeight: 36,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius)',
            background: state.restricted ? 'var(--lime)' : 'var(--bg2)',
            border: state.restricted ? 0 : '1px solid var(--border)',
            color: state.restricted ? 'var(--ink-on-accent)' : 'var(--text1)',
            fontSize: 12,
            fontWeight: 950,
            padding: '0 12px',
            textDecoration: 'none',
          }}
        >
          {state.actionLabel}
        </Link>
      </div>
      <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.65, margin: 0 }}>
        {state.description}
      </p>
    </div>
  )
}
