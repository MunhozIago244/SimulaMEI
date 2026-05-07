import type { CSSProperties } from 'react'

interface BadgeProps {
  color: string
  children: React.ReactNode
  small?: boolean
  style?: CSSProperties
}

export function Badge({ color, children, small, style }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: color + '18',
        color,
        border: `1px solid ${color}30`,
        borderRadius: 4,
        padding: small ? '2px 6px' : '3px 9px',
        fontSize: small ? 11 : 12,
        fontWeight: 600,
        fontFamily: 'var(--sans)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
