'use client'

import { useEffect } from 'react'

/**
 * Hook que observa elementos com `data-reveal` e adiciona `.is-visible`
 * quando entram em viewport, ativando o fade-up CSS de `base.css`.
 *
 * Sem este hook ativo, elementos com `data-reveal` ficam invisíveis
 * (opacity 0). Use em qualquer página que renderize componentes
 * marcados com `data-reveal` (Hero, SimulatorSection, etc).
 */
export function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]')
    if (!els.length) return

    // Fallback: se IntersectionObserver não estiver disponível, revela tudo
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach(el => el.classList.add('is-visible'))
      return
    }

    const obs = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          obs.unobserve(entry.target)
        }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -48px 0px' },
    )
    els.forEach(el => obs.observe(el))

    // Failsafe: se algum elemento ficou hidden por mais de 1.5s (ex: criado
    // depois do mount), revela manualmente. Cobre componentes condicionais.
    const failsafe = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible)')
        .forEach(el => el.classList.add('is-visible'))
    }, 1500)

    return () => {
      obs.disconnect()
      window.clearTimeout(failsafe)
    }
  }, [])
}
