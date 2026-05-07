'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OfficeClientRecord } from '@/lib/accountant/server'

interface OfficeClientSimulationFormProps {
  client: OfficeClientRecord
  defaultMonth: number
}

type SubmitState = 'idle' | 'loading' | 'error'

const inputStyle = {
  width: '100%',
  height: 44,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--bg2)',
  color: 'var(--text1)',
  padding: '0 12px',
  outline: 'none',
} as const

const labelStyle = {
  display: 'grid',
  gap: 7,
  color: 'var(--text2)',
  fontSize: 13,
  fontWeight: 800,
} as const

function toNumber(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : NaN
}

export function OfficeClientSimulationForm({ client, defaultMonth }: OfficeClientSimulationFormProps) {
  const router = useRouter()
  const [faturamentoAcumulado, setFaturamentoAcumulado] = useState('')
  const [mesAtual, setMesAtual] = useState(String(defaultMonth))
  const [folhaMensal, setFolhaMensal] = useState('0')
  const [cnae, setCnae] = useState(client.cnae)
  const [tipoMei, setTipoMei] = useState(client.tipo_mei)
  const [state, setState] = useState<SubmitState>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('loading')
    setError('')

    const response = await fetch(`/api/accountant/clients/${client.id}/simulate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        faturamentoAcumulado: toNumber(faturamentoAcumulado),
        mesAtual: Number(mesAtual),
        folhaMensal: toNumber(folhaMensal),
        cnae,
        tipoMei,
      }),
    })
    const data = await response.json()

    if (!response.ok) {
      setState('error')
      setError(data.error ?? 'Não foi possível simular este cliente.')
      return
    }

    router.push(`/contador/clientes/${client.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
      <div className="accountant-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 0.45fr 0.75fr', gap: 14 }}>
        <label htmlFor="client-sim-revenue" style={labelStyle}>
          Faturamento acumulado no ano
          <input
            id="client-sim-revenue"
            inputMode="decimal"
            value={faturamentoAcumulado}
            onChange={event => setFaturamentoAcumulado(event.target.value)}
            placeholder="42000,00"
            required
            style={inputStyle}
          />
        </label>
        <label htmlFor="client-sim-month" style={labelStyle}>
          Mês atual
          <input
            id="client-sim-month"
            type="number"
            min={1}
            max={12}
            value={mesAtual}
            onChange={event => setMesAtual(event.target.value)}
            required
            style={inputStyle}
          />
        </label>
        <label htmlFor="client-sim-payroll" style={labelStyle}>
          Folha mensal
          <input
            id="client-sim-payroll"
            inputMode="decimal"
            value={folhaMensal}
            onChange={event => setFolhaMensal(event.target.value)}
            placeholder="0,00"
            required
            style={inputStyle}
          />
        </label>
      </div>

      <div className="accountant-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr', gap: 14 }}>
        <label htmlFor="client-sim-cnae" style={labelStyle}>
          CNAE usado na simulação
          <input id="client-sim-cnae" value={cnae} onChange={event => setCnae(event.target.value)} required style={inputStyle} />
        </label>
        <label htmlFor="client-sim-type" style={labelStyle}>
          Tipo de MEI
          <select id="client-sim-type" value={tipoMei} onChange={event => setTipoMei(event.target.value)} style={inputStyle}>
            <option value="geral">MEI geral</option>
            <option value="caminhoneiro">MEI caminhoneiro</option>
          </select>
        </label>
      </div>

      {error ? (
        <div role="alert" style={{ border: '1px solid rgba(255, 91, 91, .35)', background: 'rgba(255, 91, 91, .1)', color: '#ffb4b4', borderRadius: 'var(--radius)', padding: 12, fontSize: 13 }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="submit"
          disabled={state === 'loading'}
          style={{ border: 0, borderRadius: 'var(--radius)', background: 'var(--lime)', color: '#000', padding: '11px 15px', fontWeight: 950, cursor: state === 'loading' ? 'wait' : 'pointer' }}
        >
          {state === 'loading' ? 'Simulando...' : 'Salvar simulação'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/contador/clientes/${client.id}`)}
          style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg2)', color: 'var(--text1)', padding: '11px 15px', fontWeight: 850, cursor: 'pointer' }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
