'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import type { CnaeInfo } from '@/types/tributario'
import { buscarCnaes, getCnaesAgrupados } from '@/lib/tributario'
import { Badge } from '@/components/ui'

interface CnaeAutocompleteProps {
  value: CnaeInfo | null
  onChange: (cnae: CnaeInfo | null) => void
  inputId?: string
  /** Página de origem — determina para onde o link "ver ficha" aponta como ?back= */
  origin?: string
}

const ANEXO_COLORS: Record<string, string> = {
  I: 'var(--blue)',
  II: 'var(--blue)',
  III: 'var(--lime)',
  IV: 'var(--yellow)',
  V: 'var(--orange)',
}

const CATEGORIA_LABEL: Record<CnaeInfo['categoria'], string> = {
  ti_consultoria: 'TI / Consultoria',
  servicos: 'Serviços',
  comercio: 'Comércio',
  construcao: 'Construção',
  industria: 'Indústria',
}

const CATEGORIA_ORDER: CnaeInfo['categoria'][] = [
  'ti_consultoria',
  'servicos',
  'comercio',
  'construcao',
  'industria',
]

function isClassificacaoPendente(cnae: CnaeInfo) {
  return cnae.classificacaoTributaria === 'pendente'
}

function CnaeRow({
  c,
  isLast,
  onSelect,
  fichaHref,
}: {
  c: CnaeInfo
  isLast: boolean
  onSelect: (c: CnaeInfo) => void
  fichaHref: string
}) {
  const pendente = isClassificacaoPendente(c)
  return (
    <button
      type="button"
      onClick={() => onSelect(c)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '10px 14px',
        background: 'none', border: 'none',
        borderBottom: !isLast ? '1px solid var(--border)' : 'none',
        color: 'var(--text1)', textAlign: 'left', cursor: 'pointer',
        transition: 'background .1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', flexShrink: 0, minWidth: 88 }}>
        {c.cnae}
      </span>
      <span style={{ fontSize: 13, flex: 1, lineHeight: 1.4 }}>{c.descricao}</span>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
        {pendente ? (
          <>
            <Badge color="var(--yellow)" small>CNAE oficial</Badge>
            <a
              href={fichaHref}
              onClick={e => e.stopPropagation()}
              style={{ color: 'var(--lime)', fontSize: 11, textDecoration: 'none', padding: '2px 0' }}
            >
              ver ficha
            </a>
          </>
        ) : (
          <Badge color={c.categoria === 'ti_consultoria' ? 'var(--lime)' : 'var(--blue)'} small>
            {CATEGORIA_LABEL[c.categoria]}
          </Badge>
        )}
        {!pendente && c.elegivelFatorR && (
          <Badge color="var(--yellow)" small>Fator R</Badge>
        )}
      </div>
    </button>
  )
}

export function CnaeAutocomplete({ value, onChange, inputId, origin }: CnaeAutocompleteProps) {
  const [query, setQuery] = useState(value?.descricao ?? '')
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const agrupados = useMemo(() => getCnaesAgrupados(5), [])

  const searchResults = useMemo(() => {
    if (!query || query.length < 2) return null
    return buscarCnaes(query).slice(0, 10)
  }, [query])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function select(cnae: CnaeInfo) {
    setQuery(cnae.descricao)
    onChange(cnae)
    setOpen(false)
  }

  function fichaHref(cnae: CnaeInfo) {
    const base = `/cnae/${encodeURIComponent(cnae.cnae)}`
    return origin ? `${base}?back=${encodeURIComponent(origin)}` : base
  }

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: open ? 40 : 1 }}>
      <div
        style={{
          display: 'flex', alignItems: 'center',
          background: 'var(--bg2)',
          border: `1px solid ${focused ? 'var(--blue)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)', padding: '0 12px', gap: 8,
          transition: 'border-color .15s',
        }}
      >
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          id={inputId}
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setOpen(true)
            onChange(null)
          }}
          onFocus={() => { setFocused(true); setOpen(true) }}
          onBlur={() => setFocused(false)}
          placeholder="Busque atividade ou código CNAE..."
          style={{
            background: 'none', border: 'none', outline: 'none',
            color: 'var(--text1)', fontSize: 14, padding: '12px 0',
            width: '100%', fontFamily: 'var(--sans)',
          }}
        />
        {value && (
          <Badge
            color={isClassificacaoPendente(value) ? 'var(--yellow)' : ANEXO_COLORS[value.anexoPadrao] ?? 'var(--lime)'}
            small
          >
            {isClassificacaoPendente(value)
              ? 'Validar anexo'
              : value.elegivelFatorR ? 'III/V*' : `Anexo ${value.anexoPadrao}`}
          </Badge>
        )}
      </div>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: 'var(--radius)', zIndex: 50,
            boxShadow: '0 8px 32px rgba(0,0,0,.4)',
            maxHeight: 420,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Busca ativa */}
          {searchResults && searchResults.length > 0 && (
            <>
              <SectionHeader label={`${searchResults.length} resultado${searchResults.length > 1 ? 's' : ''}`} />
              {searchResults.map((c, i) => (
                <CnaeRow key={c.cnae} c={c} isLast={i === searchResults.length - 1} onSelect={select} fichaHref={fichaHref(c)} />
              ))}
            </>
          )}

          {searchResults && searchResults.length === 0 && (
            <div style={{ padding: '16px 14px', fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>
              Nenhum CNAE encontrado. <a href="/cnae" style={{ color: 'var(--lime)', textDecoration: 'none' }}>Buscar na base completa →</a>
            </div>
          )}

          {/* Lista por categorias (sem query) */}
          {!searchResults && CATEGORIA_ORDER.map(cat => {
            const items = agrupados[cat]
            if (!items || items.length === 0) return null
            return (
              <div key={cat}>
                <SectionHeader label={CATEGORIA_LABEL[cat]} />
                {items.map((c, i) => (
                  <CnaeRow key={c.cnae} c={c} isLast={i === items.length - 1} onSelect={select} fichaHref={fichaHref(c)} />
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{
      padding: '8px 14px 4px',
      fontSize: 10, color: 'var(--text3)',
      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg1)',
    }}>
      {label}
    </div>
  )
}
