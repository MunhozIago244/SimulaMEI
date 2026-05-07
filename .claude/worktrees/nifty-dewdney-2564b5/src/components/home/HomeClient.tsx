'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { ResultadoSimulacao } from '@/types/tributario'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/layout/HeroSection'
import { HowWeCalculate } from '@/components/layout/HowWeCalculate'
import { ContadoresSection } from '@/components/layout/ContadoresSection'
import { SimulatorSection } from '@/components/simulador/SimulatorSection'
import { PartialResults } from '@/components/resultado/PartialResults'
import { FullResults } from '@/components/resultado/FullResults'

type Theme = 'dark' | 'light'

const THEME_KEY = 'simulamei-theme'

export function HomeClient() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    try {
      const saved = localStorage.getItem(THEME_KEY)
      return saved === 'dark' || saved === 'light' ? saved : 'dark'
    } catch {
      return 'dark'
    }
  })
  const [resultado, setResultado] = useState<ResultadoSimulacao | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [unlockedEmail, setUnlockedEmail] = useState('')
  const resultadoRef = useRef<HTMLDivElement>(null)
  const fullResultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {}
  }, [theme])

  const handleToggleTheme = useCallback(() => {
    setTheme(current => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const handleResults = useCallback((res: ResultadoSimulacao) => {
    setResultado(res)
    setUnlocked(false)
    setTimeout(() => {
      resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [])

  const handleUnlock = useCallback((email: string) => {
    setUnlockedEmail(email)
    setUnlocked(true)
    setTimeout(() => {
      fullResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [])

  return (
    <>
      <Header theme={theme} onToggle={handleToggleTheme} />
      <main>
        <HeroSection />
        <SimulatorSection onResults={handleResults} />

        {resultado && (
          <div ref={resultadoRef}>
            <PartialResults resultado={resultado} onUnlock={handleUnlock} />
          </div>
        )}

        {resultado && unlocked && (
          <div ref={fullResultRef}>
            <FullResults resultado={resultado} email={unlockedEmail} />
          </div>
        )}

        <HowWeCalculate />
        <ContadoresSection />
      </main>
      <Footer />
    </>
  )
}
