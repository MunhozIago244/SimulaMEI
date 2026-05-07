import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AccountantShell } from '@/components/accountant/AccountantShell'
import { OfficeClientTable } from '@/components/accountant/OfficeClientTable'
import { normalizeOfficeClientStatusFilter, type OfficeClientStatusFilter } from '@/lib/accountant/clients'
import { getCurrentAccountantOffice, listOfficeClients } from '@/lib/accountant/server'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Clientes do contador — SimulaMEI',
  description: 'Carteira de clientes MEI do escritório contábil no SimulaMEI.',
}

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

const STATUS_TABS: Array<{ label: string; status: OfficeClientStatusFilter }> = [
  { label: 'Todos', status: 'all' },
  { label: 'Ativos', status: 'active' },
  { label: 'Pausados', status: 'inactive' },
  { label: 'Plano', status: 'plan_limit' },
]

function toPage(value: string | undefined) {
  const page = Number(value ?? '1')
  return Number.isInteger(page) && page > 0 ? page : 1
}

export default async function AccountantClientsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/contador/clientes')
  }

  const { office, error } = await getCurrentAccountantOffice(supabase, user.id, user.email)
  if (error) throw new Error(`Accountant clients office query failed: ${error}`)
  if (!office) redirect('/onboarding/contador')

  const status = normalizeOfficeClientStatusFilter(params.status)
  const page = toPage(params.page)
  const result = await listOfficeClients(office.id, { status, page })
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))

  return (
    <AccountantShell office={office} active="clients">
      <section style={{ display: 'grid', gap: 16 }}>
        <div className="accountant-section-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'end' }}>
          <div>
            <h2 style={{ fontSize: 24, marginBottom: 6 }}>Carteira de clientes</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>
              {result.total.toLocaleString('pt-BR')} cliente{result.total === 1 ? '' : 's'} nesta visão.
            </p>
          </div>
          <Link href="/contador/clientes/novo" style={{ color: 'var(--ink-on-accent)', background: 'var(--lime)', borderRadius: 'var(--radius)', padding: '10px 13px', fontWeight: 900, fontSize: 13, textDecoration: 'none' }}>
            Novo cliente
          </Link>
        </div>

        <nav aria-label="Filtro de clientes" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STATUS_TABS.map(tab => {
            const isActive = tab.status === status
            return (
              <Link
                key={tab.status}
                href={`/contador/clientes?status=${tab.status}`}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  padding: '8px 11px',
                  borderRadius: 999,
                  border: `1px solid ${isActive ? 'var(--lime)' : 'var(--border)'}`,
                  color: isActive ? 'var(--ink-on-accent)' : 'var(--text2)',
                  background: isActive ? 'var(--lime)' : 'var(--bg1)',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 850,
                }}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>

        <OfficeClientTable clients={result.clients} />

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', color: 'var(--text3)', fontSize: 13 }}>
          <span>Página {page} de {totalPages}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {page > 1 ? (
              <Link href={`/contador/clientes?status=${status}&page=${page - 1}`} style={{ color: 'var(--lime)', textDecoration: 'none', fontWeight: 900 }}>Anterior</Link>
            ) : null}
            {page < totalPages ? (
              <Link href={`/contador/clientes?status=${status}&page=${page + 1}`} style={{ color: 'var(--lime)', textDecoration: 'none', fontWeight: 900 }}>Próxima</Link>
            ) : null}
          </div>
        </div>
      </section>
    </AccountantShell>
  )
}
