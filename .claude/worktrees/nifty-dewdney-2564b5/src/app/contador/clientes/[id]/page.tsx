import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AccountantShell } from '@/components/accountant/AccountantShell'
import { OfficeClientActions } from '@/components/accountant/OfficeClientActions'
import { OfficeClientFiscalPanel } from '@/components/accountant/OfficeClientFiscalPanel'
import { OfficeClientForm } from '@/components/accountant/OfficeClientForm'
import { OfficeClientSimulationHistory } from '@/components/accountant/OfficeClientSimulationHistory'
import { getCurrentAccountantOffice, getOfficeClientById, listOfficeClientSimulations } from '@/lib/accountant/server'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Cliente contador — SimulaMEI',
  description: 'Perfil cadastral de cliente MEI na carteira do contador.',
}

interface PageProps {
  params: Promise<{ id: string }>
}

function statusLabel(ativo: boolean, reason: string | null) {
  if (ativo) return 'Ativo'
  if (reason === 'plan_limit') return 'Pausado por limite de plano'
  return 'Pausado manualmente'
}

export default async function AccountantClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?next=/contador/clientes/${id}`)
  }

  const { office, error } = await getCurrentAccountantOffice(supabase, user.id)
  if (error) throw new Error(`Accountant client detail office query failed: ${error}`)
  if (!office) redirect('/onboarding/contador')

  const [client, simulations] = await Promise.all([
    getOfficeClientById(office.id, id),
    listOfficeClientSimulations(office.id, id),
  ])
  if (!client) notFound()
  const latestSimulation = simulations[0] ?? null

  return (
    <AccountantShell office={office} active="clients">
      <section className="accountant-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
        <div style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: 22 }}>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>{client.name}</h2>
          <p style={{ color: 'var(--text2)', lineHeight: 1.6, marginBottom: 18 }}>
            Atualize dados cadastrais e mantenha o diagnóstico fiscal deste cliente registrado no histórico do escritório.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
            <Link href={`/contador/clientes/${client.id}/simular`} style={{ color: '#000', background: 'var(--lime)', borderRadius: 'var(--radius)', padding: '10px 12px', fontWeight: 950, fontSize: 13, textDecoration: 'none' }}>
              Nova simulação
            </Link>
          </div>
          <OfficeClientForm mode="edit" client={client} />
        </div>

        <aside style={{ display: 'grid', gap: 14 }}>
          <OfficeClientFiscalPanel clientId={client.id} latest={latestSimulation} />

          <div style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius)', padding: 18 }}>
            <div style={{ color: 'var(--text3)', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>Status</div>
            <div style={{ fontSize: 20, fontWeight: 950, marginBottom: 12 }}>{statusLabel(client.ativo, client.inactive_reason)}</div>
            <OfficeClientActions client={client} />
          </div>

          <div style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius)', padding: 18 }}>
            <div style={{ color: 'var(--text3)', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>Dados fiscais</div>
            <div style={{ display: 'grid', gap: 7, color: 'var(--text2)', fontSize: 14 }}>
              <span>CNAE: {client.cnae}</span>
              <span>Tipo: {client.tipo_mei === 'caminhoneiro' ? 'MEI caminhoneiro' : 'MEI geral'}</span>
              <span>UF: {client.uf ?? 'Não informada'}</span>
            </div>
          </div>
        </aside>
      </section>
      <OfficeClientSimulationHistory simulations={simulations} />
    </AccountantShell>
  )
}
