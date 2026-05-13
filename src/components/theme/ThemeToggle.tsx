'use client'

import { useSyncExternalStore, useCallback } from 'react'
import {
  readStoredTheme,
  subscribeThemeChange,
  getServerThemeSnapshot,
  saveTheme,
  type Theme,
} from '@/lib/theme'

interface ThemeToggleProps {
  size?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * Toggle dark/light auto-sincronizado entre componentes via CustomEvent.
 * Pode ser plugado em qualquer header — Home, Dashboard, Admin, etc.
 */
export function ThemeToggle({ size = 36, className = 'pressable', style }: ThemeToggleProps) {
  const theme = useSyncExternalStore(subscribeThemeChange, readStoredTheme, getServerThemeSnapshot)
  const handleToggle = useCallback(() => {
    saveTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme])

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className={className}
      onClick={handleToggle}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      aria-pressed={!isDark}
      style={{
        width: size, height: size, borderRadius: 'var(--radius)',
        background: 'var(--bg2)', border: '1px solid var(--border)',
        color: 'var(--text2)', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'border-color 160ms ease, color 160ms ease',
        ...style,
      }}
    >
      {isDark ? (
        // Sol (mostrar quando está em dark → indica que clicar vai ativar light)
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        // Lua (mostrar quando está em light → indica que clicar vai ativar dark)
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  )
}

export type { Theme }
