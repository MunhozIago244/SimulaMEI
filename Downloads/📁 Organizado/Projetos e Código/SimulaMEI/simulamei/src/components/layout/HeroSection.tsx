'use client'

import { LIMITES_MEI } from '@/lib/tributario'
import { fmt, fmtPct } from '@/lib/format'
import { MonoVal, Badge } from '@/components/ui'

const HERO_TAGS = [
  { label: 'Regra vigente 2026' },
  { label: '1.331 CNAEs' },
  { label: 'Fator R' },
  { label: 'Link compartilhável' },
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
    <div className="instrument-panel" style={{ position: 'relative' }}>
      <div className="instrument-panel-header">
        <span className="instrument-label">Resultado em formato de conversa</span>
        <Badge color="var(--yellow)">Atenção</Badge>
      </div>

      <div style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 14, alignItems: 'stretch', marginBottom: 22 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>Hoje</div>
            <MonoVal size={28}>{fmt(PREVIEW_FAT)}</MonoVal>
            <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 6 }}>{pct.toFixed(0)}% do teto usado</div>
          </div>

          <div style={{ display: 'grid', placeItems: 'center', color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
            →
          </div>

          <div style={{ background: 'rgba(245,197,66,0.08)', border: '1px solid rgba(245,197,66,0.24)', borderRadius: 'var(--radius)', padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>Projeção 12 meses</div>
            <MonoVal size={28} color="var(--yellow)">{fmt(PREVIEW_PROJECAO)}</MonoVal>
            <div style={{ color: 'var(--yellow)', fontSize: 12, marginTop: 6 }}>{fmtPct(excesso - 1)} acima do teto</div>
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>Uso do teto MEI 2026</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 800, color: 'var(--yellow)' }}>
              {pct.toFixed(0)}% usado
            </span>
          </div>
          <div style={{ height: 7, background: 'var(--bg3)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pct + '%', background: 'var(--yellow)', borderRadius: 999 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>R$ 0</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>
              {fmt(teto)} (teto)
            </span>
          </div>
        </div>

        <div className="evidence-strip" style={{ marginBottom: 18 }}>
          <span className="evidence-pill">Fator R {fmtPct(PREVIEW_FATOR_R)}</span>
          <span className="evidence-pill">Anexo III provável</span>
          <span className="evidence-pill">Compartilhar com contador</span>
        </div>

        <div style={{
          background: 'rgba(200,241,53,0.07)',
          border: '1px solid rgba(200,241,53,0.18)',
          borderRadius: 'var(--radius)',
          padding: '13px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 14,
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>Economia estimada ao planejar agora</span>
          <MonoVal size={18} color="var(--lime)">+{fmt(PREVIEW_ECONOMIA)}/ano</MonoVal>
        </div>
      </div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section
      id="inicio"
      style={{
        paddingTop: 120, paddingBottom: 20, overflow: 'hidden', position: 'relative',
      }}
    >
      <div className="section-shell hero-section-inner">
        <div
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(360px, 0.95fr)', gap: 54, alignItems: 'center' }}
          className="hero-grid"
        >
          {/* Left */}
          <div className="fade-up">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {HERO_TAGS.map((t, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '4px 9px',
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
              lineHeight: 0.96, letterSpacing: 0, marginBottom: 20,
              textWrap: 'balance',
            }}>
              O teto do MEI não deveria ser descoberto no susto.
            </h1>

            <p style={{
              fontSize: 'clamp(15px, 1.6vw, 18px)', color: 'var(--text2)',
              lineHeight: 1.6, marginBottom: 36, maxWidth: 440,
            }}>
              Simule teto, Fator R e Anexo do Simples com dados reais. O resultado já sai pronto para decidir, salvar ou mandar ao contador.
            </p>

            {/* Prova social */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 28, alignItems: 'center' }}>
              {[
                { value: '18.300+', label: 'simulações realizadas' },
                { value: '1.331', label: 'CNAEs mapeados' },
                { value: '100%', label: 'gratuito, sem cadastro' },
              ].map((stat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 900, fontSize: 18, color: 'var(--text1)' }}>
                    {stat.value}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{stat.label}</span>
                  {i < 2 && <span aria-hidden="true" style={{ marginLeft: 6, color: 'var(--text2)', fontSize: 16 }}>·</span>}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a
                href="#simulador"
                className="pressable"
                style={{
                  padding: '16px 28px', background: 'var(--lime)', color: 'var(--ink-on-accent)',
                  borderRadius: 'var(--radius)', fontWeight: 800, fontSize: 16,
                  display: 'flex', alignItems: 'center', gap: 8,
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
                className="pressable"
                style={{
                  padding: '16px 24px', background: 'none',
                  border: '1px solid var(--border2)', color: 'var(--text2)',
                  borderRadius: 'var(--radius)', fontWeight: 500, fontSize: 15,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'transform 160ms var(--ease-out), border-color 160ms ease, color 160ms ease, background-color 160ms ease',
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
