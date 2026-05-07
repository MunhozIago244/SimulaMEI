import type { ReactNode } from 'react'

interface PillProps {
  children: ReactNode
  color?: string
}

export function Pill({ children, color = 'var(--text3)' }: PillProps) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      minHeight: 28,
      padding: '6px 9px',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      color,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: 0,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}
