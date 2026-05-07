'use client'

import type { CnaeInfo, Anexo } from '@/types/tributario'
import { calcularSimples } from '@/lib/tributario'
import { FATOR_R_MINIMO } from '@/lib/tributario/fatorR'
import { fmt, fmtPct } from '@/lib/format'
import { MonoVal, Divider } from '@/components/ui'

interface LivePreviewPanelProps {
  fat: number
  mes: number
  cnae: CnaeInfo | null
  prolabore: number
  projecao: number
  excesso: number
  fatorR: number
  teto: number
}

function MetricCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: '10px 12px' }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700,
        color: color ?? 'var(--text1)',
        transition: 'color .15s',
      }}>
        {value}
      </div>
    </div>
  )
}

export function LivePreviewPanel({
  cnae, prolabore, projecao, excesso, fatorR, teto,
}: LivePreviewPanelProps) {
  const pctTeto = Math.min((projecao / teto) * 100, 130)
  const barColor = excesso > 1.2
    ? 'var(--red)'
    : excesso > 1.0
      ? 'var(--orange)'
      : excesso > 0.85
        ? 'var(--yellow)'
        : 'var(--lime)'
  const cnaePendente = cnae?.classificacaoTributaria === 'pendente'

  const economiaIIIvsV = cnae?.elegivelFatorR && !cnaePendente
    ? calcularSimples(projecao, 'V').dasAnual - calcularSimples(projecao, 'III').dasAnual
    : 0

  const anexoProvavel: Anexo = cnae
    ? (cnae.elegivelFatorR && fatorR >= FATOR_R_MINIMO ? 'III' : cnae.anexoPadrao)
    : 'III'

  const aliqEfetiva = cnae && !cnaePendente
    ? calcularSimples(projecao, anexoProvavel).aliquotaEfetiva
    : null

  return (
    <div
      className="fade-up"
      style={{
        background: 'var(--bg1)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: 28,
        position: 'sticky', top: 100,
      }}
    >
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--text3)',
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20,
      }}>
        Preview em tempo real
      </div>

      {/* Teto meter */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Uso do teto MEI</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: barColor, fontWeight: 700, transition: 'color .3s' }}>
            {pctTeto.toFixed(0)}%
          </span>
        </div>
        <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, height: '100%',
            width: Math.min(pctTeto, 100) + '%',
            background: barColor, borderRadius: 4,
            transition: 'width .3s, background .3s',
            boxShadow: excesso > 1.2 ? '0 0 8px rgba(255,59,59,0.4)' : barColor === 'var(--lime)' ? '0 0 8px rgba(200,241,53,0.3)' : 'none',
          }} />
          {pctTeto > 100 && (
            <div style={{
              position: 'absolute', top: 0, left: '100%',
              width: Math.min(pctTeto - 100, 30) + '%', height: '100%',
              background: 'var(--red)', opacity: 0.4,
              borderRadius: '0 4px 4px 0',
            }} />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{fmt(projecao)}/ano</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>Teto {fmt(teto)}</span>
        </div>
      </div>

      <Divider style={{ marginBottom: 20 }} />

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <MetricCell
          label="Fator R"
          value={prolabore > 0 ? fmtPct(fatorR) : '—'}
          color={fatorR >= FATOR_R_MINIMO ? 'var(--lime)' : 'var(--yellow)'}
        />
        <MetricCell
          label="Anexo provável"
          value={cnae ? (cnaePendente ? 'Validar' : `Anexo ${anexoProvavel}`) : '—'}
          color="var(--blue)"
        />
        <MetricCell
          label="Alíq. efetiva"
          value={aliqEfetiva != null ? fmtPct(aliqEfetiva) : '—'}
          color="var(--text1)"
        />
        <MetricCell
          label="Excesso teto"
          value={excesso > 1 ? fmtPct(excesso - 1) : 'OK'}
          color={excesso > 1 ? 'var(--red)' : 'var(--lime)'}
        />
      </div>

      {/* Economia card */}
      {cnae?.elegivelFatorR && economiaIIIvsV > 0 && (
        <div style={{
          background: 'rgba(200,241,53,0.06)', border: '1px solid rgba(200,241,53,0.15)',
          borderRadius: 'var(--radius)', padding: '12px 14px',
        }}>
          <div style={{ fontSize: 11, color: 'var(--lime)', fontWeight: 600, marginBottom: 4 }}>
            Economia estimada (Anexo III vs V)
          </div>
          <MonoVal size={22} color="var(--lime)">{fmt(economiaIIIvsV)}/ano</MonoVal>
        </div>
      )}

      {/* Alerta crítico */}
      {excesso > 1.20 && (
        <div style={{
          marginTop: 12, position: 'relative', overflow: 'hidden',
          background: 'rgba(255,59,59,0.07)', border: '1px solid rgba(255,59,59,0.2)',
          borderRadius: 'var(--radius)', padding: '12px 14px',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--red)' }} />
          <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600, lineHeight: 1.4 }}>
            ⚠ Excesso acima de 20% — tributação retroativa ao 1º dia do ano aplica-se neste cenário.
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, padding: '12px 0 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
          Estimativa com base nas regras vigentes 2026. Confirme a decisão final com seu contador.
        </div>
      </div>
    </div>
  )
}
