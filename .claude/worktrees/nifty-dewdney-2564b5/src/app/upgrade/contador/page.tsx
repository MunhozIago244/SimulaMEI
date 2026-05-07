import Link from 'next/link'
import { CheckoutButton } from '@/components/billing/CheckoutButton'
import { StaticPageLayout } from '@/components/layout/StaticPageLayout'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAccountantOffice } from '@/lib/accountant/server'
import { getSiteUrl } from '@/constants/site'

const PAGE_TITLE = 'Planos para Contadores — SimulaMEI'
const PAGE_DESCRIPTION = 'Assine Starter ou Pro e gerencie sua carteira MEI com dashboard, alertas e API.'
const PAGE_URL = `${getSiteUrl()}/upgrade/contador`

export const metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    siteName: 'SimulaMEI',
    type: 'website' as const,
    locale: 'pt_BR',
    images: [
      {
        url: `${getSiteUrl()}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Planos para Contadores — SimulaMEI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [`${getSiteUrl()}/opengraph-image`],
  },
}

const PLANS = [
  {
    name: 'Starter',
    price: 'R$ 97/mês',
    description: 'Até 30 clientes MEI, dashboard de carteira, histórico de simulações e alertas por plano.',
    endpoint: '/api/checkout/accountant-starter',
    featured: false,
  },
  {
    name: 'Pro',
    price: 'R$ 247/mês',
    description: 'Até 150 clientes MEI, reativação automática dos pausados por limite e base pronta para API.',
    endpoint: '/api/checkout/accountant-pro',
    featured: true,
  },
] as const

export default async function AccountantUpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Sem sessão — não bloqueia a página, CheckoutButton vai retornar 401 e tratar
  const hasOffice = user
    ? await getCurrentAccountantOffice(supabase, user.id).then(r => Boolean(r.office))
    : null // null = não autenticado (não sabemos)

  return (
    <StaticPageLayout
      title="Planos para contadores"
      subtitle="Escolha o plano do escritório. O checkout usa assinatura recorrente no Stripe e o webhook sincroniza limites sem apagar clientes."
    >
      {/* Banner — escritório ausente */}
      {hasOffice === false && (
        <div style={{
          background: 'rgba(245,197,66,0.07)',
          border: '1px solid rgba(245,197,66,0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 22px',
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius)',
            background: 'rgba(245,197,66,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            ⚠
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 14 }}>
              Escritório contador não encontrado
            </div>
            <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.5 }}>
              Crie o escritório antes de assinar. O plano fica vinculado ao escritório — sem ele o checkout é bloqueado.
            </p>
          </div>
          <Link
            href="/onboarding/contador"
            style={{
              flexShrink: 0,
              padding: '10px 16px',
              borderRadius: 'var(--radius)',
              background: 'var(--yellow)',
              color: '#000',
              fontSize: 13,
              fontWeight: 800,
              whiteSpace: 'nowrap',
              textDecoration: 'none',
            }}
          >
            Criar escritório →
          </Link>
        </div>
      )}

      <section style={{ display: 'grid', gap: 14 }}>
        {PLANS.map(plan => (
          <article
            key={plan.name}
            style={{
              border: `1px solid ${plan.featured ? 'var(--lime)' : 'var(--border)'}`,
              background: plan.featured ? 'rgba(220, 255, 80, 0.06)' : 'var(--bg1)',
              borderRadius: 'var(--radius-lg)',
              padding: 22,
              // Desabilita visualmente se escritório ausente
              opacity: hasOffice === false ? 0.5 : 1,
              pointerEvents: hasOffice === false ? 'none' : undefined,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'baseline', marginBottom: 8 }}>
              <h2 style={{ color: 'var(--text1)', fontSize: 22 }}>{plan.name}</h2>
              <strong style={{ color: plan.featured ? 'var(--lime)' : 'var(--text2)' }}>{plan.price}</strong>
            </div>
            <p style={{ color: 'var(--text2)', marginBottom: 16 }}>{plan.description}</p>
            <CheckoutButton
              endpoint={plan.endpoint}
              eventName="accountant_checkout_started"
              officeRequired
              style={plan.featured ? undefined : { background: 'var(--text1)', color: 'var(--bg0)' }}
            >
              Assinar {plan.name}
            </CheckoutButton>
          </article>
        ))}

        <article style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'baseline', marginBottom: 8 }}>
            <h2 style={{ color: 'var(--text1)', fontSize: 22 }}>Enterprise</h2>
            <strong style={{ color: 'var(--text2)' }}>Sob consulta</strong>
          </div>
          <p style={{ color: 'var(--text2)', marginBottom: 16 }}>
            Para carteiras grandes, multi-seat, white-label completo, SLA e integrações sob contrato.
          </p>
          <Link
            href="/para-contadores"
            style={{
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius)',
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              color: 'var(--text1)',
              fontWeight: 900,
              padding: '0 16px',
              textDecoration: 'none',
            }}
          >
            Falar com comercial
          </Link>
        </article>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, display: 'grid', gap: 8 }}>
          <h2 style={{ color: 'var(--text1)', fontSize: 18 }}>Já assinou?</h2>
          <CheckoutButton
            endpoint="/api/billing/portal"
            eventName="accountant_billing_portal_opened"
            style={{ background: 'transparent', color: 'var(--text1)', border: '1px solid var(--border)' }}
          >
            Gerenciar assinatura no Stripe
          </CheckoutButton>
        </div>
      </section>
    </StaticPageLayout>
  )
}
