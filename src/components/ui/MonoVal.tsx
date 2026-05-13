import type { ReactNode } from 'react'

interface MonoValProps {
  children: ReactNode
  size?: number
  color?: string
}

export function MonoVal({ children, size = 28, color = 'var(--text1)' }: MonoValProps) {
  return (
    <span
      style={{
        fontFamily: 'var(--mono)',
        fontWeight: 700,
        fontSize: size,
        color,
        letterSpacing: '-0.02em',
        transition: 'color 220ms var(--ease-out)',
      }}
    >
      {children}
    </span>
  )
}
