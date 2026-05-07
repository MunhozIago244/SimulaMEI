import type { CSSProperties } from 'react'

interface DividerProps {
  style?: CSSProperties
}

export function Divider({ style }: DividerProps) {
  return (
    <div
      style={{
        width: '100%',
        height: 1,
        background: 'var(--border)',
        ...style,
      }}
    />
  )
}
