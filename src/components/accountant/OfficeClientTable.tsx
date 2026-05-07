import Link from 'next/link'
import type { OfficeClientRecord } from '@/lib/accountant/server'

interface OfficeClientTableProps {
  clients: OfficeClientRecord[]
}

function getStatus(client: OfficeClientRecord) {
  if (client.ativo) return { label: 'Ativo', color: 'var(--lime)' }
  if (client.inactive_reason === 'plan_limit') return { label: 'Pausado por plano', color: 'var(--orange)' }
  return { label: 'Pausado', color: 'var(--yellow)' }
}

export function OfficeClientTable({ clients }: OfficeClientTableProps) {
  if (clients.length === 0) {
    return (
      <div style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius)', padding: 22 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Nenhum cliente nesta visão</h2>
        <p style={{ color: 'var(--text2)', lineHeight: 1.6, marginBottom: 16 }}>
          Cadastre o primeiro cliente para iniciar a carteira do escritório.
        </p>
        <Link href="/contador/clientes/novo" style={{ color: 'var(--ink-on-accent)', background: 'var(--lime)', borderRadius: 'var(--radius)', padding: '10px 13px', fontWeight: 900, fontSize: 13, textDecoration: 'none' }}>
          Cadastrar cliente
        </Link>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--text3)', fontSize: 12, textTransform: 'uppercase' }}>
            <th style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>Cliente</th>
            <th style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>CNAE</th>
            <th style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>Cidade</th>
            <th style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>Status</th>
            <th style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>Ação</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(client => {
            const status = getStatus(client)
            return (
              <tr key={client.id}>
                <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 900 }}>{client.name}</div>
                  <div style={{ color: 'var(--text3)', fontSize: 12 }}>{client.email ?? 'Sem e-mail'}</div>
                </td>
                <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>{client.cnae}</td>
                <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>
                  {[client.municipio, client.uf].filter(Boolean).join(' / ') || 'Não informado'}
                </td>
                <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid var(--border)', borderRadius: 999, padding: '5px 9px', fontSize: 12, color: 'var(--text2)' }}>
                    <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 99, background: status.color }} />
                    {status.label}
                  </span>
                </td>
                <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                  <Link href={`/contador/clientes/${client.id}`} style={{ color: 'var(--lime)', fontSize: 13, fontWeight: 900, textDecoration: 'none' }}>
                    Abrir
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
