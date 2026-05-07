import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AccountantBillingNotice } from '@/components/accountant/AccountantBillingNotice'
import { AccountantShell } from '@/components/accountant/AccountantShell'
import { CheckoutButton } from '@/components/billing/CheckoutButton'
import { getAccountantBillingState } from '@/lib/accountant/billing-state'
import { getCurrentAccountantOffice, getOfficeClientStats } from '@/lib/accountant/server'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Assinatura do contador — SimulaMEI',
  description: 'Gestão de plano, limite de clientes e cobrança do escritório contador no SimulaMEI.',
}

const PLAN_OPTIONS = [
  {
    plan: 'starter',
    name: 'Starter',
    price: 'R$ 97/mês',
    limit: '30 clientes ativos',
    endpoint: '/api/checkout/accountant-starter',
  },
  {
    plan: 'pro',
    name: 'Pro',
    price: 'R$ 247/mês',
    limit: '150 clientes ativos',
    endpoint: '/api/checkout/accountant-pro',
  },
] as const

function formatDate(value: string | null) {
  if (!value) return 'Sem data'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export default async function AccountantBillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/contador/assinatura')
  }

  const { office, error } = await getCurrentAccountantOffice(supabase, user.id, user.email)
  if (error) throw new Error(`Accountant billing office query failed: ${error}`)
  if (!office) redirect('/onboarding/contador')

  const [stats] = await Promise.all([
    getOfficeClientStats(office.id),
  ])
  const billingState = getAccountantBillingState(office)
  const isOwner = office.role === 'owner'
  const usagePct = office.max_clients > 0
    ? Math.min(100, Math.round((stats.active / office.max_clients) * 100))
    : 0

  return (
    <AccountantShell office={office} active="billing">
      <section style={{ display: 'grid', gap: 16 }}>
        <AccountantBillingNotice state={billingState} />

        <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <article style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: 22 }}>
            <div style={{ color: 'var(--text3)', fontSize: 12, textTransform: 'uppercase', fontWeight: 950, marginBottom: 8 }}>
              Plano atual
            </div>
            <h2 style={{ fontSize: 30, marginBottom: 8 }}>{billingState.planLabel}</h2>
            <p style={{ color: 'var(--text2)', lineHeight: 1.6, marginBottom: 18 }}>
              {billingState.statusLabel} · {stats.active}/{office.max_clients} clientes ativos
            </p>
            <div style={{ height: 10, borderRadius: 999, background: 'var(--bg2)', overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ width: `${usagePct}%`, height: '100%', background: usagePct >= 90 ? 'var(--yellow)' : 'var(--lime)' }} />
            </div>
            <div style={{ display: 'grid', gap: 9, color: 'var(--text2)', fontSize: 13 }}>
              <span>Renovação/fim do ciclo: {formatDate(billingState.currentPeriodEnd)}</span>
              <span>Fim do trial: {formatDate(billingState.trialEndsAt)}</span>
              <span>Pausados por limite: {stats.planLimitInactive.toLocaleString('pt-BR')}</span>
            </div>
          </article>

          <article style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: 22 }}>
            <div style={{ color: 'var(--text3)', fontSize: 12, textTransform: 'uppercase', fontWeight: 950, marginBottom: 8 }}>
              Cobrança
            </div>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>Portal Stripe</h2>
            <p style={{ color: 'var(--text2)', lineHeight: 1.6, marginBottom: 18 }}>
              Cartão, cancelamento e dados de cobrança ficam no Customer Portal.
            </p>
            {office.stripe_customer_id && isOwner ? (
              <CheckoutButton
                endpoint="/api/billing/portal"
                eventName="accountant_billing_portal_opened"
                style={{ background: 'var(--text1)', color: 'var(--bg0)' }}
              >
                Abrir portal de cobrança
              </CheckoutButton>
            ) : isOwner ? (
              <Link
                href="/upgrade/contador"
                style={{
                  minHeight: 44,
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: 'var(--radius)',
                  background: 'var(--lime)',
                  color: 'var(--ink-on-accent)',
                  fontWeight: 950,
                  padding: '0 15px',
                  textDecoration: 'none',
                }}
              >
                Escolher plano
              </Link>
            ) : (
              <p style={{ color: 'var(--text3)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Apenas o owner do escritório pode alterar cobrança.
              </p>
            )}
          </article>
        </div>

        <section className="dashboard-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
          {PLAN_OPTIONS.map(option => {
            const isCurrent = office.plan === option.plan
            return (
              <article
                key={option.plan}
                style={{
                  border: `1px solid ${isCurrent ? 'var(--lime)' : 'var(--border)'}`,
                  background: isCurrent ? 'rgba(220, 255, 80, .06)' : 'var(--bg1)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 20,
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div>
                  <h2 style={{ fontSize: 22, marginBottom: 6 }}>{option.name}</h2>
                  <strong style={{ color: isCurrent ? 'var(--lime)' : 'var(--text1)' }}>{option.price}</strong>
                </div>
                <p style={{ color: 'var(--text2)', fontSize: 13, margin: 0 }}>{option.limit}</p>
                {isCurrent ? (
                  <span style={{ color: 'var(--lime)', fontSize: 13, fontWeight: 950 }}>Plano atual</span>
                ) : isOwner ? (
                  <CheckoutButton
                    endpoint={option.endpoint}
                    eventName="accountant_checkout_started"
                    style={{ minHeight: 38, background: 'var(--bg2)', color: 'var(--text1)', border: '1px solid var(--border)' }}
                  >
                    Mudar para {option.name}
                  </CheckoutButton>
                ) : (
                  <span style={{ color: 'var(--text3)', fontSize: 13 }}>Owner necessário</span>
                )}
              </article>
            )
          })}

          <article style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'grid', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 22, marginBottom: 6 }}>Enterprise</h2>
              <strong style={{ color: 'var(--text1)' }}>Sob contrato</strong>
            </div>
            <p style={{ color: 'var(--text2)', fontSize: 13, margin: 0 }}>Carteiras acima de 150 clientes, SLA e implantação assistida.</p>
            <Link href="/para-contadores" style={{ color: 'var(--lime)', fontSize: 13, fontWeight: 950, textDecoration: 'none' }}>
              Falar com comercial
            </Link>
          </article>
        </section>
      </section>
    </AccountantShell>
  )
}
