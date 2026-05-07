'use client'

import type { ResultadoSimulacao } from '@/types/tributario'
import { Divider } from '@/components/ui'

interface FiscalScoreProps {
  score: number
  estado: { label: string; color: string }
  resultado: ResultadoSimulacao
}

interface ScoreAction {
  text: string
  tone: 'neutral' | 'warn' | 'danger' | 'ok'
}

function getActions(resultado: ResultadoSimulacao): ScoreAction[] {
  const { alertaTeto, fatorR, entrada } = resultado
  const actions: ScoreAction[] = []

  if (alertaTeto.percentualUtilizado > 0.85) {
    actions.push({ text: 'Monitore faturamento mensalmente', tone: 'warn' })
  }
  if (fatorR && !fatorR.atingeMinimo && fatorR.fatorR > 0) {
    const faltaMensal = Math.max(0, fatorR.proLaboreMinimo - entrada.folhaMensal)
    actions.push({
      text: `Aumente pró-labore ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(faltaMensal)}/mês para atingir 28%`,
      tone: 'warn',
    })
  }
  if (alertaTeto.percentualExcesso > 0) {
    actions.push({ text: 'Avalie transição para ME agora', tone: 'danger' })
  }
  if (!entrada.cnae) {
    actions.push({ text: 'Confirme o CNAE com seu contador', tone: 'neutral' })
  }
  actions.push({ text: 'Valide a simulação com um contador credenciado', tone: 'ok' })

  return actions.slice(0, 4)
}

const ARC_LENGTH = 220

export function FiscalScore({ score, estado, resultado }: FiscalScoreProps) {
  const actions = getActions(resultado)
  const dashFill = (score / 100) * ARC_LENGTH
  const gradId = 'score-arc-grad'

  return (
    <div style={{
      background: 'var(--bg1)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '28px 24px',
    }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Score de Saúde Fiscal</h3>

      {/* SVG arc gauge com gradiente */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', width: 180, height: 110 }}>
          <svg width="180" height="110" viewBox="0 0 180 110">
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff3b3b" />
                <stop offset="50%" stopColor="#f5c542" />
                <stop offset="100%" stopColor="#c8f135" />
              </linearGradient>
            </defs>
            {/* Track */}
            <path
              d="M 20 100 A 70 70 0 0 1 160 100"
              fill="none" stroke="var(--bg3)" strokeWidth="10" strokeLinecap="round"
            />
            {/* Fill com gradiente */}
            <path
              d="M 20 100 A 70 70 0 0 1 160 100"
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${dashFill} ${ARC_LENGTH}`}
              style={{
                transition: 'stroke-dasharray .8s cubic-bezier(.16,1,.3,1)',
                filter: `drop-shadow(0 0 8px ${estado.color}60)`,
              }}
            />
          </svg>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 800,
              color: estado.color, lineHeight: 1,
            }}>
              {score}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>{estado.label}</div>
          </div>
        </div>
      </div>

      <Divider style={{ marginBottom: 16 }} />

      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--text3)',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
      }}>
        Ações recomendadas
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {actions.map((a, i) => (
          <div key={i} className="score-action-row">
            <span
              className="score-action-index"
              style={{
                borderColor: a.tone === 'danger'
                  ? 'rgba(255,59,59,0.34)'
                  : a.tone === 'warn'
                    ? 'rgba(245,197,66,0.34)'
                    : a.tone === 'ok'
                      ? 'rgba(200,241,53,0.34)'
                      : 'var(--border2)',
                color: a.tone === 'danger'
                  ? 'var(--red)'
                  : a.tone === 'warn'
                    ? 'var(--yellow)'
                    : a.tone === 'ok'
                      ? 'var(--lime)'
                      : 'var(--text3)',
              }}
            >
              {i + 1}
            </span>
            <span style={{ lineHeight: 1.5 }}>{a.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
