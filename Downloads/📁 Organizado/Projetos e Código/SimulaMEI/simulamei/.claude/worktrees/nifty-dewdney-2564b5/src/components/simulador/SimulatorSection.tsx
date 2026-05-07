'use client'

import { useRef, useState, useMemo } from 'react'
import type { CnaeInfo, ResultadoSimulacao, TipoMei } from '@/types/tributario'
import { LIMITES_MEI, FATOR_R_MINIMO, TOLERANCIA_EXCESSO } from '@/lib/tributario'
import { captureProductEvent } from '@/lib/analytics/events'
import { fmt, fmtPct, MESES_ABREVIADOS } from '@/lib/format'
import { Tooltip, MonoVal, LoadSpinner } from '@/components/ui'
import { CnaeAutocomplete } from './CnaeAutocomplete'
import { LivePreviewPanel } from './LivePreviewPanel'

interface SimulatorSectionProps {
  onResults: (resultado: ResultadoSimulacao) => void
}

interface ValidationMsg {
  msg: string
  type: 'ok' | 'warn' | 'error'
}

function FieldLabel({ children, tip }: { children: React.ReactNode; tip?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <span style={{
        fontSize: 12, fontWeight: 600, color: 'var(--text2)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {children}
      </span>
      {tip && <Tooltip tip={tip} />}
    </div>
  )
}

function Validation({ validation }: { validation: ValidationMsg | null }) {
  if (!validation?.msg) return null
  const colorMap = { error: 'var(--red)', warn: 'var(--yellow)', ok: 'var(--lime)' }
  const iconMap = { error: '✕', warn: '!', ok: '✓' }
  return (
    <div style={{
      fontSize: 12, color: colorMap[validation.type],
      marginTop: 5, display: 'flex', alignItems: 'center', gap: 4,
    }}>
      <span>{iconMap[validation.type]}</span>
      {validation.msg}
    </div>
  )
}

const FAT_SLIDER_MAX = 180000
const PROLABORE_SLIDER_MAX = 15000

function SliderWithInput({
  value, min, max, step,
  onChange,
  sliderColor,
  ariaLabel,
  maxLabel,
}: {
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  sliderColor: string
  ariaLabel: string
  maxLabel: string
}) {
  const pct = Math.min((value / max) * 100, 100)

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '')
    const num = Math.min(Math.max(Number(raw), min), max)
    onChange(num)
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <input
          type="range" min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            flex: 1,
            '--slider-pct': pct + '%',
            '--slider-fill': sliderColor,
          } as React.CSSProperties}
          aria-label={ariaLabel}
        />
        <input
          type="text"
          inputMode="numeric"
          value={value === 0 ? '' : value.toLocaleString('pt-BR')}
          onChange={handleInputChange}
          placeholder="0"
          className="slider-number-input"
          aria-label={`${ariaLabel} — valor numérico`}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>R$ 0</span>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{maxLabel}</span>
      </div>
    </>
  )
}

export function SimulatorSection({ onResults }: SimulatorSectionProps) {
  const [fat, setFat] = useState(54000)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [cnae, setCnae] = useState<CnaeInfo | null>(null)
  const [prolabore, setProlabore] = useState(0)
  const [temProlabore, setTemProlabore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [requestError, setRequestError] = useState('')
  const startedTrackedRef = useRef(false)

  const tipoMei: TipoMei = cnae?.cnae === '4930-2/02' ? 'caminhoneiro' : 'geral'
  const cnaePendente = cnae?.classificacaoTributaria === 'pendente'
  const teto = LIMITES_MEI[tipoMei].anual

  const projecao = mes > 0 ? (fat / mes) * 12 : fat
  const excesso = projecao / teto
  const fatorRVal = temProlabore && prolabore > 0
    ? (prolabore * 12) / projecao
    : 0

  const fatValidation = useMemo((): ValidationMsg | null => {
    if (fat === 0) return null
    if (excesso > 1 + TOLERANCIA_EXCESSO) return {
      msg: `Projeção ${fmt(projecao)} — excede o teto em ${fmtPct(excesso - 1)}`,
      type: 'error',
    }
    if (excesso > 1.0) return {
      msg: `Projeção ${fmt(projecao)} — dentro da tolerância de ${fmtPct(TOLERANCIA_EXCESSO)} acima do teto`,
      type: 'warn',
    }
    if (excesso > 0.85) return {
      msg: `Projeção ${fmt(projecao)} — atenção, próximo do teto`,
      type: 'warn',
    }
    return { msg: `Projeção anual: ${fmt(projecao)}`, type: 'ok' }
  }, [fat, projecao, excesso])

  const prolaboreValidation = useMemo((): ValidationMsg | null => {
    if (!temProlabore || prolabore === 0) return null
    if (fatorRVal >= FATOR_R_MINIMO) return {
      msg: `Fator R ${fmtPct(fatorRVal)} ≥ ${fmtPct(FATOR_R_MINIMO)} — Anexo III (menor alíquota)`,
      type: 'ok',
    }
    return {
      msg: `Fator R ${fmtPct(fatorRVal)} < ${fmtPct(FATOR_R_MINIMO)} — Anexo V. Considere aumentar o pró-labore.`,
      type: 'warn',
    }
  }, [temProlabore, prolabore, fatorRVal])

  const sliderColor = excesso > 1 + TOLERANCIA_EXCESSO
    ? 'var(--red)'
    : excesso > 1.0
      ? 'var(--orange)'
      : excesso > 0.85
        ? 'var(--yellow)'
        : 'var(--lime)'

  const prolaboreColor = fatorRVal >= FATOR_R_MINIMO ? 'var(--lime)' : 'var(--yellow)'

  function trackSimulationStart() {
    if (startedTrackedRef.current) return
    startedTrackedRef.current = true
    captureProductEvent('simulation_started', { month: mes, hasPayroll: temProlabore })
  }

  async function handleSimular() {
    if (!cnae || cnaePendente) return
    setRequestError('')
    setLoading(true)
    trackSimulationStart()

    const response = await fetch('/api/simular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        faturamentoAcumulado: fat,
        mesAtual: mes,
        cnae: cnae.cnae,
        folhaMensal: temProlabore ? prolabore : 0,
        tipoMei,
      }),
    })

    const payload = await response.json().catch(() => null) as ResultadoSimulacao | { error?: string } | null

    if (!response.ok || !payload || !('entrada' in payload)) {
      setLoading(false)
      setRequestError((payload && 'error' in payload && payload.error) || 'Não foi possível processar a simulação agora.')
      return
    }

    captureProductEvent('simulation_completed', {
      cnae: payload.entrada.cnae,
      tipoMei: payload.entrada.tipoMei,
      anexoAtual: payload.anexoAtual,
      hasFatorR: Boolean(payload.fatorR),
      cenarioTeto: payload.alertaTeto.cenario,
    })
    setLoading(false)
    onResults(payload)
  }

  return (
    <section id="simulador" style={{ padding: '80px 0 60px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 60, alignItems: 'start' }}
          className="sim-grid"
        >
          {/* ── Left: form ───────────────────────────────────── */}
          <div className="fade-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 28, height: 2, background: 'var(--lime)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--lime)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Simulador
              </span>
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 8 }}>
              Seus dados fiscais,<br />em menos de 1 minuto.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 40 }}>
              Preencha os campos abaixo. O resultado aparece em tempo real, sem cadastro.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* 1. Faturamento */}
              <div>
                <FieldLabel tip="Faturamento acumulado desde janeiro deste ano (sem deduções).">
                  Faturamento acumulado no ano
                </FieldLabel>
                <div style={{
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                    <MonoVal size={32} color={sliderColor}>{fmt(fat)}</MonoVal>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>de {fmt(teto)} (teto)</span>
                  </div>
                  <SliderWithInput
                    value={fat} min={0} max={FAT_SLIDER_MAX} step={500}
                    onChange={v => { trackSimulationStart(); setFat(v) }}
                    sliderColor={sliderColor}
                    ariaLabel="Faturamento acumulado"
                    maxLabel="R$ 180k"
                  />
                </div>
                <Validation validation={fatValidation} />
              </div>

              {/* 2. Mês atual */}
              <div>
                <FieldLabel tip="Em qual mês estamos? Usado para projetar o faturamento anual com base no acumulado.">
                  Mês atual
                </FieldLabel>
                <div
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}
                  className="mes-grid"
                >
                  {MESES_ABREVIADOS.map((m, i) => {
                    const mesNum = i + 1
                    const ativo = mes === mesNum
                    return (
                      <button
                        key={mesNum}
                        onClick={() => { trackSimulationStart(); setMes(mesNum) }}
                        style={{
                          padding: '8px 4px', borderRadius: 'var(--radius)',
                          background: ativo ? 'var(--lime)' : 'var(--bg2)',
                          color: ativo ? '#000' : 'var(--text2)',
                          border: `1px solid ${ativo ? 'var(--lime)' : 'var(--border)'}`,
                          fontSize: 11, fontWeight: ativo ? 700 : 500,
                          cursor: 'pointer', transition: 'all .15s',
                        }}
                      >
                        {m}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 3. CNAE */}
              <div>
                <FieldLabel tip="O CNAE determina qual Anexo do Simples se aplica e afeta diretamente a alíquota.">
                  Atividade / CNAE
                </FieldLabel>
                <CnaeAutocomplete value={cnae} origin="/#simulador" onChange={value => {
                  trackSimulationStart()
                  setCnae(value)
                }} />
                {!cnae && (
                  <Validation validation={{ msg: 'Selecione a atividade para calcular o Anexo correto', type: 'warn' }} />
                )}
                {cnaePendente && (
                  <Validation validation={{ msg: 'CNAE oficial encontrado; falta curadoria tributária para calcular Anexo e Fator R', type: 'warn' }} />
                )}
              </div>

              {/* 4. Pró-labore */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <FieldLabel tip="Pró-labore é a remuneração do sócio. Afeta o Fator R e pode reduzir a alíquota no Simples.">
                    Pró-labore / folha mensal
                  </FieldLabel>
                  <label className="toggle-wrap" style={{ cursor: 'pointer' }}>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                      {temProlabore ? 'Ativo' : 'Não tenho'}
                    </span>
                    <div
                      className={`toggle ${temProlabore ? 'on' : ''}`}
                      onClick={() => { trackSimulationStart(); setTemProlabore(v => !v) }}
                    />
                  </label>
                </div>
                {temProlabore && (
                  <div style={{ animation: 'fadeUp .25s ease forwards' }}>
                    <div style={{
                      background: 'var(--bg2)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)', padding: '16px 18px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                        <MonoVal size={28}>
                          {fmt(prolabore)}
                          <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text2)' }}>/mês</span>
                        </MonoVal>
                        <span style={{ fontSize: 12, color: prolaboreColor }}>
                          Fator R: <b>{fmtPct(fatorRVal)}</b>
                        </span>
                      </div>
                      <SliderWithInput
                        value={prolabore} min={0} max={PROLABORE_SLIDER_MAX} step={200}
                        onChange={v => { trackSimulationStart(); setProlabore(v) }}
                        sliderColor={prolaboreColor}
                        ariaLabel="Pró-labore mensal"
                        maxLabel="R$ 15k"
                      />
                    </div>
                    <Validation validation={prolaboreValidation} />
                  </div>
                )}
              </div>
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
              <button
                onClick={handleSimular}
                disabled={!cnae || cnaePendente || loading}
                style={{
                  flex: 1, padding: '16px 24px',
                  background: cnae && !cnaePendente ? 'var(--lime)' : 'var(--bg3)',
                  color: cnae && !cnaePendente ? '#000' : 'var(--text3)',
                  borderRadius: 'var(--radius)', fontWeight: 700, fontSize: 15,
                  cursor: cnae && !cnaePendente ? 'pointer' : 'not-allowed',
                  transition: 'all .2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={e => {
                  if (cnae && !cnaePendente) {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = 'var(--lime-glow)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {loading ? (
                  <><LoadSpinner /> Calculando...</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    Ver resultado
                  </>
                )}
              </button>
              <a
                href="#como-calcula"
                style={{
                  padding: '16px 20px',
                  background: 'none', color: 'var(--text2)',
                  border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
                  fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  transition: 'all .15s', display: 'flex', alignItems: 'center',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--text2)'
                  e.currentTarget.style.color = 'var(--text1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border2)'
                  e.currentTarget.style.color = 'var(--text2)'
                }}
              >
                Como calcula
              </a>
            </div>
            {requestError && (
              <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>
                {requestError}
              </div>
            )}
          </div>

          {/* ── Right: live preview panel ─────────────────────── */}
          <div className="fade-up-2 desktop-only">
            <LivePreviewPanel
              fat={fat}
              mes={mes}
              cnae={cnae}
              prolabore={temProlabore ? prolabore : 0}
              projecao={projecao}
              excesso={excesso}
              fatorR={fatorRVal}
              teto={teto}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
