'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Cursor custom inspirado em portfólios designer (aerukart.com pattern).
 *
 * Comportamento:
 * - Círculo pequeno fixo no cursor (dot)
 * - Anel maior segue com lag suave (ring) — sensação de "peso"
 * - Quando passa sobre [data-cursor="hover"] ou <a>, <button>, o anel
 *   cresce e a cor muda pra accent
 * - Some quando o cursor sai da janela
 * - Esconde em touch devices (sem mouse real)
 * - Respeita prefers-reduced-motion (deixa cursor nativo)
 *
 * IMPORTANTE: marca body[data-cursor-active="true"] só quando o JS confirma
 * que vai funcionar. O CSS `cursor: none` só aplica nesse caso — evita o
 * bug "cursor nativo some e custom não aparece" se algo falhar.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false)
  const dotRef = useRef<HTMLDivElement | null>(null)
  const ringRef = useRef<HTMLDivElement | null>(null)

  // Effect 1: detecta se device suporta cursor custom (re-render se sim)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!hasFinePointer || prefersReducedMotion) return
    setEnabled(true)
  }, [])

  // Effect 2: registra listeners DEPOIS que os elementos renderizam
  // (depende de `enabled` pra rodar após o re-render que cria dot/ring)
  useEffect(() => {
    if (!enabled) return
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    // Ativa o CSS `cursor: none` apenas agora — garantia de fallback
    document.body.setAttribute('data-cursor-active', 'true')

    // Posições alvo (mouse) e atual (interpolada com lag)
    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let ringX = mouseX
    let ringY = mouseY

    // Posição inicial (evita "flash" no canto antes do primeiro move)
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`
    dot.style.opacity = '1'
    ring.style.opacity = '1'

    function onMove(e: MouseEvent) {
      mouseX = e.clientX
      mouseY = e.clientY
      if (dot) dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`
      if (dot) dot.style.opacity = '1'
      if (ring) ring.style.opacity = '1'
    }

    function onLeave() {
      if (dot) dot.style.opacity = '0'
      if (ring) ring.style.opacity = '0'
    }

    function onMouseOver(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target?.closest) return
      const interactive = target.closest('a, button, [role="button"], input, select, textarea, [data-cursor="hover"]')
      if (interactive) {
        ring?.classList.add('is-hovering')
      } else {
        ring?.classList.remove('is-hovering')
      }
    }

    let rafId = 0
    function tick() {
      ringX += (mouseX - ringX) * 0.18
      ringY += (mouseY - ringY) * 0.18
      if (ring) ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onMouseOver, { passive: true })
    window.addEventListener('mouseout', onLeave, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onMouseOver)
      window.removeEventListener('mouseout', onLeave)
      document.body.removeAttribute('data-cursor-active')
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <div ref={ringRef} className="cc-ring" aria-hidden="true" />
      <div ref={dotRef} className="cc-dot" aria-hidden="true" />
    </>
  )
}
