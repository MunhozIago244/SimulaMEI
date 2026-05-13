/**
 * Helpers compartilhados para tema dark/light.
 *
 * - Persistência via localStorage com chave `simulamei-theme`
 * - Sincronização cross-tab e cross-component via CustomEvent
 * - Init no <head> de app/layout.tsx aplica data-theme antes do paint
 *   pra evitar flash
 */

export type Theme = 'dark' | 'light'

export const THEME_KEY = 'simulamei-theme'
export const THEME_CHANGE_EVENT = 'simulamei-theme-change'

export function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  try {
    const saved = window.localStorage.getItem(THEME_KEY)
    return saved === 'dark' || saved === 'light' ? saved : 'dark'
  } catch {
    return 'dark'
  }
}

export function subscribeThemeChange(onChange: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(THEME_CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function getServerThemeSnapshot(): Theme {
  return 'dark'
}

export function saveTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(THEME_KEY, theme)
  } catch {}
  document.documentElement.setAttribute('data-theme', theme)
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
}
