'use client'

import { Badge } from '@/components/ui'

interface ExcessoVisualProps {
  excesso: number // projecao / teto
  teto: number
  projecao: number
}

interface Faixa {
  label: string
  range: string
  color: string
  desc: string
  active: boolean
}

export function ExcessoVisual({ excesso }: ExcessoVisualProps) {
  const faixas: Faixa[] = [
    {
      label: 'Dentro do teto',
      range: '0–100%',
      color: 'var(--lime)',
      desc: 'MEI regular. Sem riscos de tributação retroativa.',
      active: excesso <= 1,
    },
    {
      label: 'Margem de 20%',
      range: '100–120%',
      color: 'var(--yellow)',
      desc: 'Tolerância permitida. Atenção total ao crescimento.',
      active: excesso > 1 && excesso <= 1.20,
    },
    {
      label: 'Excesso crítico',
      range: '> 120%',
      color: 'var(--red)',
      desc: 'Tributação retroativa aplica-se a partir do 1º dia do ano. Migração obrigatória para ME.',
      active: excesso > 1.20,
    },
  ]

  return (
    <div style={{
      background: 'var(--bg1)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '28px 32px',
    }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
        Regras de excesso do teto MEI
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 28 }}>
        Entenda o que acontece em cada faixa de ultrapassagem do limite anual.
      </p>

      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}
        className="excess-grid"
      >
        {faixas.map((f, i) => (
          <div
            key={i}
            style={{
              background: f.active ? f.color + '12' : 'var(--bg2)',
              border: `1px solid ${f.active ? f.color + '40' : 'var(--border)'}`,
              borderRadius: 'var(--radius)', padding: '18px 20px',
              transition: 'border-color 180ms ease, background-color 180ms ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {f.active && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: f.color,
                }} />
              )}
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: f.active ? f.color : 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {f.label}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: f.color, marginBottom: 8 }}>
              {f.range}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{f.desc}</p>
            {f.active && (
              <div style={{ marginTop: 8 }}>
                <Badge color={f.color} small>Seu cenário atual</Badge>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
