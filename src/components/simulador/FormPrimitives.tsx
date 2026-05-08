import { Tooltip } from '@/components/ui'

export function FieldLabel({ children, tip }: { children: React.ReactNode; tip?: string }) {
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

export interface ValidationMsg {
  msg: string
  type: 'ok' | 'warn' | 'error'
}

export function Validation({ validation }: { validation: ValidationMsg | null }) {
  const colorMap = { error: 'var(--red)', warn: 'var(--yellow)', ok: 'var(--lime)' }
  const iconMap = { error: '✕', warn: '▲', ok: '✓' }
  const active = Boolean(validation?.msg)
  return (
    <div style={{
      maxHeight: active ? 44 : 0,
      opacity: active ? 1 : 0,
      overflow: 'hidden',
      transition: 'max-height 220ms var(--ease-out), opacity 180ms var(--ease-out)',
      marginTop: active ? 6 : 0,
    }}>
      {validation?.msg && (
        <div style={{
          fontSize: 12, color: colorMap[validation.type],
          display: 'flex', alignItems: 'flex-start', gap: 5, lineHeight: 1.5,
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>
            {iconMap[validation.type]}
          </span>
          {validation.msg}
        </div>
      )}
    </div>
  )
}

export function SliderWithInput({
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
