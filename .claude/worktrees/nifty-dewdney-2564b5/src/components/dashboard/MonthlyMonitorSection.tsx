'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt, fmtPct } from '@/lib/format'
import type { MonthlyMonitorSummary } from '@/lib/monitor'

interface RecentMonthlyRow {
  ano: number
  mes: number
  faturamentoMes: number
  folhaMes: number
  anexoCalculado: string | null
  fatorR: number | null
}

interface TransitionPreview {
  from: string
  to: string
  ano: number
  mes: number
  fatorR: number
}

interface MonthlyMonitorSectionProps {
  cnae: string
  tipoMei: 'geral' | 'caminhoneiro'
  defaultMonth: number
  defaultYear: number
  defaultRevenue: number
  defaultPayroll: number
  initialSummary: MonthlyMonitorSummary | null
  initialTransition: TransitionPreview | null
  recentRows: RecentMonthlyRow[]
  monthlyInputsError?: string | null
}

function monthLabel(month: number) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(new Date(2026, Math.max(0, month - 1), 1))
}

export function MonthlyMonitorSection({
  cnae,
  tipoMei,
  defaultMonth,
  defaultYear,
  defaultRevenue,
  defaultPayroll,
  initialSummary,
  initialTransition,
  recentRows,
  monthlyInputsError,
}: MonthlyMonitorSectionProps) {
  const router = useRouter()
  const [month, setMonth] = useState(String(defaultMonth))
  const [year, setYear] = useState(String(defaultYear))
  const [revenue, setRevenue] = useState(defaultRevenue ? String(Math.round(defaultRevenue)) : '')
  const [payroll, setPayroll] = useState(String(Math.round(defaultPayroll)))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<MonthlyMonitorSummary | null>(initialSummary)
  const [transition, setTransition] = useState<TransitionPreview | null>(initialTransition)

  const metrics = useMemo(() => {
    if (!summary) return null
    return [
      ['DAS estimado', `${fmt(summary.dasMensalEstimado)}/mês`],
      ['Pró-labore ideal', `${fmt(summary.proLaboreIdeal)}/mês`],
      ['Fator R', fmtPct(summary.fatorRAtual)],
      ['RBT12 monitorado', fmt(summary.rbt12)],
    ] as const
  }, [summary])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const response = await fetch('/api/monthly-inputs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ano: Number(year),
        mes: Number(month),
        faturamentoMes: Number(revenue),
        folhaMes: Number(payroll),
        cnae,
        tipoMei,
      }),
    })

    const payload = await response.json().catch(() => null) as
      | {
        error?: string
        summary?: MonthlyMonitorSummary
        transition?: TransitionPreview | null
      }
      | null

    if (!response.ok) {
      setError(payload?.error ?? 'Não foi possível atualizar o monitor mensal.')
      setSaving(false)
      return
    }

    setSummary(payload?.summary ?? null)
    setTransition(payload?.transition ?? null)
    setSaving(false)
    router.refresh()
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div>
        <h3 style={{ fontSize: 18, margin: '0 0 6px' }}>Monitor mensal</h3>
        <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
          Atualize o mês corrente para recalcular DAS, Fator R e alertas de mudança de anexo.
        </p>
      </div>

      {monthlyInputsError && (
        <div style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius)',
          border: '1px solid rgba(255,204,0,0.24)',
          background: 'rgba(255,204,0,0.08)',
          color: 'var(--yellow)',
          fontSize: 13,
        }}>
          O schema de `monthly_inputs` ainda não está disponível no Supabase. A interface está pronta, mas a migration precisa ser aplicada.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <div className="dashboard-radar-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
          <div>
            <label htmlFor="monitor-month" style={{ display: 'block', fontSize: 11, color: 'var(--text3)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Mês</label>
            <select
              id="monitor-month"
              value={month}
              onChange={event => setMonth(event.target.value)}
              style={{ width: '100%', minHeight: 42, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text1)', padding: '10px 12px' }}
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="monitor-year" style={{ display: 'block', fontSize: 11, color: 'var(--text3)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Ano</label>
            <input
              id="monitor-year"
              inputMode="numeric"
              value={year}
              onChange={event => setYear(event.target.value)}
              style={{ width: '100%', minHeight: 42, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text1)', padding: '10px 12px' }}
            />
          </div>
          <div>
            <label htmlFor="monitor-revenue" style={{ display: 'block', fontSize: 11, color: 'var(--text3)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Faturamento do mês</label>
            <input
              id="monitor-revenue"
              inputMode="decimal"
              value={revenue}
              onChange={event => setRevenue(event.target.value)}
              style={{ width: '100%', minHeight: 42, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text1)', padding: '10px 12px' }}
            />
          </div>
          <div>
            <label htmlFor="monitor-payroll" style={{ display: 'block', fontSize: 11, color: 'var(--text3)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Folha / pró-labore</label>
            <input
              id="monitor-payroll"
              inputMode="decimal"
              value={payroll}
              onChange={event => setPayroll(event.target.value)}
              style={{ width: '100%', minHeight: 42, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text1)', padding: '10px 12px' }}
            />
          </div>
        </div>

        {error && (
          <div style={{ color: 'var(--red)', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ color: 'var(--text3)', fontSize: 12 }}>
            CNAE monitorado: <span style={{ fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{cnae}</span>
          </div>
          <button
            type="submit"
            disabled={saving || Boolean(monthlyInputsError)}
            style={{
              minHeight: 42,
              padding: '0 16px',
              borderRadius: 'var(--radius)',
              background: 'var(--lime)',
              color: '#000',
              fontSize: 13,
              fontWeight: 800,
              opacity: saving || monthlyInputsError ? 0.7 : 1,
              cursor: saving || monthlyInputsError ? 'wait' : 'pointer',
            }}
          >
            {saving ? 'Atualizando...' : 'Salvar mês'}
          </button>
        </div>
      </form>

      {metrics && (
        <div className="dashboard-radar-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
          {metrics.map(([label, value]) => (
            <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14 }}>
              <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.25 }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {transition && (
        <div style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius)',
          border: '1px solid rgba(200,241,53,0.24)',
          background: 'rgba(200,241,53,0.08)',
        }}>
          <div style={{ color: 'var(--lime)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
            Mudança de anexo detectada
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>
            O monitor registrou transição de <strong>{transition.from}</strong> para <strong>{transition.to}</strong> em {monthLabel(transition.mes)} de {transition.ano}, com Fator R de {fmtPct(transition.fatorR)}.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
          Últimos lançamentos
        </div>
        {recentRows.length > 0 ? recentRows.slice(0, 4).map(row => (
          <div key={`${row.ano}-${row.mes}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{monthLabel(row.mes)} / {row.ano}</div>
              <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>
                {fmt(row.faturamentoMes)} faturado · {fmt(row.folhaMes)} de folha
              </div>
            </div>
            <div style={{ color: 'var(--text2)', fontSize: 12, fontWeight: 700 }}>
              {row.anexoCalculado ? `Anexo ${row.anexoCalculado}` : 'sem anexo'}
            </div>
          </div>
        )) : (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14, color: 'var(--text2)', fontSize: 13 }}>
            Nenhum mês salvo ainda. O primeiro lançamento ativa o histórico do monitor.
          </div>
        )}
      </div>
    </div>
  )
}
