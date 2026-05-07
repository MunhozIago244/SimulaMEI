'use client'

import type { ReactNode } from 'react'

interface TooltipProps {
  tip: string
  children?: ReactNode
  gap?: number
}

export function Tooltip({ tip, children, gap = 5 }: TooltipProps) {
  return (
    <span className="tt-wrap" style={{ gap }}>
      {children}
      <span className="tt-icon" tabIndex={0} aria-label={tip}>?</span>
      <span className="tt-box" role="tooltip">{tip}</span>
    </span>
  )
}
