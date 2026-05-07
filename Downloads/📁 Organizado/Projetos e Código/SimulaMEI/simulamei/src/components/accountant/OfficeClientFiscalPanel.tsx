import Link from 'next/link'
import { fmt, fmtPct } from '@/lib/format'
import { calcFiscalScore, getFiscalScoreEstado } from '@/lib/tributario/fiscalScore'
import type { OfficeSimulationRecord } from '@/lib/accountant/server'

interface OfficeClientFiscalPanelProps {
  clientId: string
  latest: OfficeSimulationRecord | null
}

const REGIME_LABEL: Record<string, string> = {
  simplesAtual: 'Simples atual',
  simplesOtimo: 'Simples otimizado',
  presumido: 'Lucro presumido',
  real: 'Lucro real',
}

export function OfficeClientFiscalPanel({ clientId, latest }: OfficeClientFiscalPanelProps) {
  if (!latest) {
    return (
      <div style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius)', padding: 18 }}>
        <div style={{ color: 'var(--text3)', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>Diagnóstico fiscal</div>
        <h3 style={{ fontSize: 20, marginBottom: 8 }}>Sem simulação ainda</h3>
        <p style={{ color: 'var(--text2)', lineHeight: 1.6, fontSize: 14, marginBottom: 14 }}>
          Rode a primeira simulação para registrar teto, Fator R, anexo e melhor regime para este cliente.
        </p>
        <Link href={`/contador/clientes/${clientId}/simular`} style={{ color: 'var(--ink-on-accent)', background: 'var(--lime)', borderRadius: 'var(--radius)', padding: '10px 12px', fontWeight: 950, fontSize: 13, textDecoration: 'none', display: 'inline-flex' }}>
          Simular agora
        </Link>
      </div>
    )
  }

  const resultado = latest.resultado
  const score = calcFiscalScore(resultado)
  const scoreEstado = getFiscalScoreEstado(score)
  const updatedAt = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(latest.created_at))

  const items = [
    ['Score', `${score} · ${scoreEstado.label}`],
    ['Projeção anual', fmt(resultado.alertaTeto.projecaoAnual)],
    ['Uso do teto', fmtPct(resultado.alertaTeto.percentualUtilizado)],
    ['Anexo atual', resultado.anexoAtual],
    ['Melhor regime', REGIME_LABEL[resultado.comparativo.melhorRegime] ?? resultado.comparativo.melhorRegime],
    ['Economia possível', fmt(resultado.comparativo.economiaVsMelhor)],
  ]

  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius)', padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 14 }}>
        <div>
          <div style={{ color: 'var(--text3)', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>Última simulação</div>
          <h3 style={{ fontSize: 20 }}>Diagnóstico fiscal</h3>
        </div>
        <span style={{ color: scoreEstado.color, border: `1px solid ${scoreEstado.color}`, borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900 }}>
          {score}
        </span>
      </div>

      <div style={{ display: 'grid', gap: 9, marginBottom: 14 }}>
        {items.map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: 'var(--text2)', fontSize: 13 }}>
            <span>{label}</span>
            <strong style={{ color: 'var(--text1)', textAlign: 'right' }}>{value}</strong>
          </div>
        ))}
      </div>

      <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 14 }}>Atualizado em {updatedAt}</p>
      <Link href={`/contador/clientes/${clientId}/simular`} style={{ color: 'var(--lime)', fontSize: 13, fontWeight: 950, textDecoration: 'none' }}>
        Rodar nova simulação
      </Link>
    </div>
  )
}
