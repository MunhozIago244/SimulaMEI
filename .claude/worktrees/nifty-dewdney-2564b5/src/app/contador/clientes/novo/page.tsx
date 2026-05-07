import { redirect } from 'next/navigation'
import { AccountantBillingNotice } from '@/components/accountant/AccountantBillingNotice'
import { AccountantShell } from '@/components/accountant/AccountantShell'
import { OfficeClientForm } from '@/components/accountant/OfficeClientForm'
import { getAccountantBillingState } from '@/lib/accountant/billing-state'
import { getCurrentAccountantOffice, getOfficeClientStats } from '@/lib/accountant/server'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Novo cliente — SimulaMEI',
  description: 'Cadastro de cliente MEI na carteira do escritório contábil.',
}

export default async function NewAccountantClientPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/contador/clientes/novo')
  }

  const { office, error } = await getCurrentAccountantOffice(supabase, user.id)
  if (error) throw new Error(`New accountant client office query failed: ${error}`)
  if (!office) redirect('/onboarding/contador')

  const stats = await getOfficeClientStats(office.id)
  const isAtLimit = stats.active >= office.max_clients
  const billingState = getAccountantBillingState(office)

  return (
    <AccountantShell office={office} active="clients">
      <section style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: 22 }}>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>Novo cliente</h2>
        <p style={{ color: 'var(--text2)', lineHeight: 1.6, marginBottom: 18 }}>
          {stats.active}/{office.max_clients} clientes ativos no plano atual.
        </p>

        {billingState.restricted ? (
          <AccountantBillingNotice state={billingState} />
        ) : isAtLimit ? (
          <div role="alert" style={{ border: '1px solid rgba(255, 193, 7, .35)', background: 'rgba(255, 193, 7, .1)', color: 'var(--yellow)', borderRadius: 'var(--radius)', padding: 14 }}>
            Limite de clientes ativos atingido. Pause um cliente ou altere o plano para cadastrar outro.
          </div>
        ) : (
          <OfficeClientForm mode="create" />
        )}
      </section>
    </AccountantShell>
  )
}
