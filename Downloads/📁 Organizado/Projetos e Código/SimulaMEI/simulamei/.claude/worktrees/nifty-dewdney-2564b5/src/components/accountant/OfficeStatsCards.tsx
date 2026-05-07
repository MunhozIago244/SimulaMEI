import Link from 'next/link'
import type { OfficeClientStats } from '@/lib/accountant/server'

interface OfficeStatsCardsProps {
  stats: OfficeClientStats
  limit: number
  trialEndsAt: string | null
}

export function OfficeStatsCards({ stats, limit, trialEndsAt }: OfficeStatsCardsProps) {
  const usage = limit > 0 ? Math.min(100, Math.round((stats.active / limit) * 100)) : 0
  const items = [
    { label: 'Clientes ativos', value: stats.active.toLocaleString('pt-BR'), accent: 'var(--lime)' },
    { label: 'Limite do plano', value: limit.toLocaleString('pt-BR'), accent: 'var(--blue)' },
    { label: 'Pausados manualmente', value: stats.manualInactive.toLocaleString('pt-BR'), accent: 'var(--yellow)' },
    { label: 'Pausados por plano', value: stats.planLimitInactive.toLocaleString('pt-BR'), accent: 'var(--orange)' },
  ]

  return (
    <section style={{ marginBottom: 22 }}>
      <div className="dashboard-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
        {items.map(item => (
          <div key={item.label} style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius)', padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <div style={{ color: 'var(--text3)', fontSize: 12, textTransform: 'uppercase' }}>{item.label}</div>
              <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: 99, background: item.accent }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 950 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius)', padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: 'var(--text2)', fontSize: 13, marginBottom: 8 }}>
          <span>Uso da carteira</span>
          <span>{usage}% · {stats.active}/{limit}</span>
        </div>
        <div aria-label={`Uso da carteira: ${usage}%`} style={{ height: 10, borderRadius: 99, background: 'var(--bg2)', overflow: 'hidden' }}>
          <div style={{ width: `${usage}%`, height: '100%', background: 'linear-gradient(90deg, var(--lime), var(--blue))' }} />
        </div>
        {trialEndsAt ? (
          <p style={{ margin: '10px 0 0', color: 'var(--text3)', fontSize: 12 }}>
            Trial ativo até {trialEndsAt}.
          </p>
        ) : null}
        {stats.planLimitInactive > 0 ? (
          <p style={{ margin: '10px 0 0', color: 'var(--orange)', fontSize: 12, lineHeight: 1.6 }}>
            {stats.planLimitInactive} cliente(s) pausado(s) por limite de plano.{' '}
            <Link href="/upgrade/contador" style={{ color: 'var(--lime)', fontWeight: 900 }}>
              Ajustar plano
            </Link>
          </p>
        ) : null}
        {stats.active >= limit ? (
          <p style={{ margin: '10px 0 0', color: 'var(--yellow)', fontSize: 12, lineHeight: 1.6 }}>
            Limite de clientes ativos atingido.{' '}
            <Link href="/contador/assinatura" style={{ color: 'var(--lime)', fontWeight: 900 }}>
              Ver assinatura
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  )
}
