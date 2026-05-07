import type { OfficeAlertRecord } from '@/lib/accountant/server'
import { OfficeAlertResolveButton } from './OfficeAlertResolveButton'

interface OfficeAlertsPanelProps {
  openAlerts: OfficeAlertRecord[]
  resolvedAlerts: OfficeAlertRecord[]
}

const SEVERITY_COLOR = {
  info: 'var(--blue)',
  warn: 'var(--yellow)',
  danger: 'var(--red)',
} as const

function formatDate(value: string | null) {
  if (!value) return 'Sem data'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getAlertTitle(alert: OfficeAlertRecord) {
  return alert.payload.title ?? `${alert.payload.clientName ?? 'Cliente'} exige atenção`
}

function getAlertBody(alert: OfficeAlertRecord) {
  return alert.payload.body ?? `Alerta ${alert.tipo} em ${alert.mes_referencia}.`
}

function getAlertColor(alert: OfficeAlertRecord) {
  const severity = alert.payload.severity
  if (severity && severity in SEVERITY_COLOR) {
    return SEVERITY_COLOR[severity]
  }

  return 'var(--yellow)'
}

export function OfficeAlertsPanel({ openAlerts, resolvedAlerts }: OfficeAlertsPanelProps) {
  return (
    <section style={{ display: 'grid', gap: 14, marginBottom: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'end' }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Alertas da carteira</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>
            Acompanhamento automático por simulação recente e mês de referência.
          </p>
        </div>
        <span style={{ color: 'var(--text3)', fontSize: 12, fontWeight: 900 }}>
          {openAlerts.length} aberto{openAlerts.length === 1 ? '' : 's'}
        </span>
      </div>

      {openAlerts.length > 0 ? (
        <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          {openAlerts.map(alert => (
            <article key={alert.id} style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius)', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 10 }}>
                <div>
                  <span style={{ color: getAlertColor(alert), fontSize: 11, fontWeight: 950, textTransform: 'uppercase' }}>
                    {alert.tipo.replaceAll('_', ' ')} · {alert.mes_referencia}
                  </span>
                  <h3 style={{ color: 'var(--text1)', fontSize: 16, margin: '6px 0 0', lineHeight: 1.25 }}>
                    {getAlertTitle(alert)}
                  </h3>
                </div>
              </div>
              <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.65, margin: '0 0 12px' }}>
                {getAlertBody(alert)}
              </p>
              <OfficeAlertResolveButton alertId={alert.id} />
            </article>
          ))}
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius)', padding: 16 }}>
          <h3 style={{ color: 'var(--text1)', fontSize: 16, marginBottom: 6 }}>Nenhum alerta aberto</h3>
          <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.65, margin: 0 }}>
            O cron da carteira cria alertas quando uma simulação recente passa de 70%, 80%, 95%, 100% ou excesso grave do teto.
          </p>
        </div>
      )}

      {resolvedAlerts.length > 0 ? (
        <div style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius)', padding: 16 }}>
          <h3 style={{ color: 'var(--text1)', fontSize: 16, marginBottom: 10 }}>Resolvidos recentes</h3>
          <div style={{ display: 'grid', gap: 9 }}>
            {resolvedAlerts.map(alert => (
              <div key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: 'var(--text2)', fontSize: 13, borderTop: '1px solid var(--border)', paddingTop: 9 }}>
                <span>{getAlertTitle(alert)}</span>
                <span style={{ color: 'var(--text3)', textAlign: 'right' }}>
                  {formatDate(alert.resolved_at)} · {alert.resolved_by_label ?? 'responsável não identificado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
