import { notFound, redirect } from 'next/navigation'
import { AccountantShell } from '@/components/accountant/AccountantShell'
import { OfficeClientSimulationForm } from '@/components/accountant/OfficeClientSimulationForm'
import { getCurrentAccountantOffice, getOfficeClientById } from '@/lib/accountant/server'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Simular cliente — SimulaMEI',
  description: 'Simulação fiscal vinculada a cliente do escritório contábil.',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AccountantClientSimulationPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?next=/contador/clientes/${id}/simular`)
  }

  const { office, error } = await getCurrentAccountantOffice(supabase, user.id, user.email)
  if (error) throw new Error(`Accountant client simulation office query failed: ${error}`)
  if (!office) redirect('/onboarding/contador')

  const client = await getOfficeClientById(office.id, id)
  if (!client) notFound()

  const defaultMonth = new Date().getMonth() + 1

  return (
    <AccountantShell office={office} active="clients">
      <section className="accountant-simulation-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        <div style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: 22 }}>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>Simular {client.name}</h2>
          <p style={{ color: 'var(--text2)', lineHeight: 1.6, marginBottom: 18 }}>
            A simulação será salva no histórico do cliente e ficará disponível no perfil do escritório.
          </p>
          {client.ativo ? (
            <OfficeClientSimulationForm client={client} defaultMonth={defaultMonth} />
          ) : (
            <div role="alert" style={{ border: '1px solid rgba(255, 193, 7, .35)', background: 'rgba(255, 193, 7, .1)', color: 'var(--yellow)', borderRadius: 'var(--radius)', padding: 14 }}>
              Reative o cliente antes de criar uma nova simulação.
            </div>
          )}
        </div>

        <aside style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius)', padding: 18 }}>
          <div style={{ color: 'var(--text3)', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>Base cadastral</div>
          <div style={{ display: 'grid', gap: 8, color: 'var(--text2)', fontSize: 14 }}>
            <span>CNAE: {client.cnae}</span>
            <span>Tipo: {client.tipo_mei === 'caminhoneiro' ? 'MEI caminhoneiro' : 'MEI geral'}</span>
            <span>Status: {client.ativo ? 'Ativo' : 'Pausado'}</span>
          </div>
        </aside>
      </section>
    </AccountantShell>
  )
}
