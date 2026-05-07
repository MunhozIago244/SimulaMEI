'use client'

import { LIMITES_MEI } from '@/lib/tributario'
import { fmt, fmtPct } from '@/lib/format'
import { Tag, MonoVal, Badge } from '@/components/ui'

const HERO_TAGS = [
  { label: 'Regra vigente 2026' },
  { label: 'Teto MEI + Caminhoneiro' },
  { label: 'Fontes oficiais' },
  { label: 'Estimativa validável' },
]

// Static preview — hardcoded example data for illustration only
const PREVIEW_FAT = 67500
const PREVIEW_MES = 5
const PREVIEW_PROJECAO = (PREVIEW_FAT / PREVIEW_MES) * 12
const PREVIEW_FATOR_R = 0.28
const PREVIEW_ECONOMIA = 12400

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function HeroPreviewCard() {
  const teto = LIMITES_MEI.geral.anual
  const pct = (PREVIEW_FAT / teto) * 100
  const excesso = PREVIEW_PROJECAO / teto

  return (
    <div style={{
      background: 'var(--bg1)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 28,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 140, height: 140, borderRadius: '50%',
        background: 'var(--lime)', opacity: 0.06,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Faturamento acumulado</div>
          <MonoVal size={32}>{fmt(PREVIEW_FAT)}</MonoVal>
        </div>
        <Badge color="var(--yellow)">Atenção</Badge>
      </div>

      {/* Teto bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>Uso do teto MEI 2026</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--yellow)' }}>
            {pct.toFixed(0)}% usado
          </span>
        </div>
        <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: pct + '%', background: 'var(--yellow)',
            borderRadius: 3, transition: 'width 1s cubic-bezier(.34,1.56,.64,1)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>R$ 0</span>
          <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>
            {fmt(teto)} (teto)
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Projeção 12m', val: fmt(PREVIEW_PROJECAO), color: 'var(--yellow)' },
          { label: 'Fator R', val: fmtPct(PREVIEW_FATOR_R), color: 'var(--lime)' },
          { label: 'Excesso', val: fmtPct(excesso - 1), color: 'var(--orange)' },
        ].map((m, i) => (
          <div key={i} style={{
            background: 'var(--bg2)', borderRadius: 'var(--radius)',
            padding: '10px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: m.color }}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* Economy chip */}
      <div style={{
        background: 'rgba(200,241,53,0.07)', border: '1px solid rgba(200,241,53,0.15)',
        borderRadius: 'var(--radius)', padding: '12px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>Economia estimada (Anexo III)</span>
        <MonoVal size={18} color="var(--lime)">+{fmt(PREVIEW_ECONOMIA)}/ano</MonoVal>
      </div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section
      style={{
        paddingTop: 120, paddingBottom: 0, overflow: 'hidden', position: 'relative',
        background: 'radial-gradient(ellipse 70% 50% at 30% 60%, rgba(200,241,53,0.04) 0%, transparent 70%)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }} className="hero-section-inner">
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}
          className="hero-grid"
        >
          {/* Left */}
          <div className="fade-up">
            {/* Tags com ícone SVG real e pill arredondado */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {HERO_TAGS.map((t, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 20, padding: '4px 10px',
                    fontSize: 12, color: 'var(--text2)',
                  }}
                >
                  <span style={{ color: 'var(--lime)', display: 'flex' }}>
                    <CheckIcon />
                  </span>
                  {t.label}
                </span>
              ))}
            </div>

            <h1 style={{
              fontSize: 'clamp(38px, 5.5vw, 72px)', fontWeight: 800,
              lineHeight: 1.0, letterSpacing: '-0.03em', marginBottom: 20,
            }}>
              Descubra antes<br />
              de{' '}
              <span style={{ color: 'var(--lime)', display: 'inline-block', position: 'relative' }}>
                estourar
                <span style={{
                  position: 'absolute', bottom: -4, left: 0, right: 0,
                  height: 3, background: 'var(--lime)', borderRadius: 2, opacity: 0.5,
                }} />
              </span>
              <br />
              o MEI.
            </h1>

            <p style={{
              fontSize: 'clamp(15px, 1.6vw, 18px)', color: 'var(--text2)',
              lineHeight: 1.6, marginBottom: 36, maxWidth: 440,
            }}>
              Simule teto, Fator R e Anexo do Simples com dados reais do seu negócio.
              Resultado em menos de 1 minuto, sem cadastro.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a
                href="#simulador"
                style={{
                  padding: '16px 28px', background: 'var(--lime)', color: '#000',
                  borderRadius: 'var(--radius)', fontWeight: 800, fontSize: 16,
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'transform .15s, box-shadow .15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = 'var(--lime-glow)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                Simular agora
              </a>

              <a
                href="#como-calcula"
                style={{
                  padding: '16px 24px', background: 'none',
                  border: '1px solid var(--border2)', color: 'var(--text2)',
                  borderRadius: 'var(--radius)', fontWeight: 500, fontSize: 15,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all .15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--text2)'
                  e.currentTarget.style.color = 'var(--text1)'
                  const arrow = e.currentTarget.querySelector<HTMLSpanElement>('.hero-arrow')
                  if (arrow) arrow.style.transform = 'translateX(3px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border2)'
                  e.currentTarget.style.color = 'var(--text2)'
                  const arrow = e.currentTarget.querySelector<HTMLSpanElement>('.hero-arrow')
                  if (arrow) arrow.style.transform = 'translateX(0)'
                }}
              >
                Ver como o cálculo funciona
                <span className="hero-arrow" style={{ transition: 'transform .15s', display: 'inline-block' }}>→</span>
              </a>
            </div>
          </div>

          {/* Right: preview card */}
          <div className="fade-up-2 desktop-only">
            <HeroPreviewCard />
          </div>
        </div>
      </div>

      {/* Gradient fade para a próxima seção */}
      <div className="hero-gradient-fade" />
    </section>
  )
}
