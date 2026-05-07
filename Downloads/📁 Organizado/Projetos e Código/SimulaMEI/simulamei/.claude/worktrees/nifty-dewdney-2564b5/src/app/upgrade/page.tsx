import { redirect } from 'next/navigation'
import { CheckoutButton } from '@/components/billing/CheckoutButton'
import { StaticPageLayout } from '@/components/layout/StaticPageLayout'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Upgrade — SimulaMEI',
  description: 'Assine o monitor mensal e libere relatórios avançados do SimulaMEI.',
}

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/upgrade')
  }

  const { data: profile } = await supabase.from('user_profiles').select('plano').eq('id', user.id).maybeSingle()

  return (
    <StaticPageLayout
      title="Plano Pro"
      subtitle="Monitor mensal, alertas por e-mail, checkout recorrente e acesso ao PDF completo."
    >
      <section style={{ display: 'grid', gap: 18 }}>
        <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h2 style={{ fontSize: 20, color: 'var(--text1)', marginBottom: 8 }}>Inclui</h2>
          <ul style={{ paddingLeft: 18 }}>
            <li>Monitor mensal com histórico</li>
            <li>Calendário fiscal por e-mail</li>
            <li>Alertas de mudança de anexo</li>
            <li>Download do relatório premium</li>
          </ul>
        </div>

        {profile?.plano === 'pro' ? (
          <div style={{ color: 'var(--lime)', fontWeight: 700 }}>
            Sua conta já está no Plano Pro.
          </div>
        ) : (
          <CheckoutButton endpoint="/api/checkout/monitor" eventName="monitor_waitlist_joined">
            Assinar por R$ 19/mês
          </CheckoutButton>
        )}
      </section>
    </StaticPageLayout>
  )
}
