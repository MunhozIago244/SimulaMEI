import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCnae } from '@/lib/tributario'
import { isOnboardingComplete, type UserProfileOnboarding } from '@/lib/onboarding'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export const metadata = {
  title: 'Pré-cadastro — SimulaMEI',
  description: 'Complete as informações obrigatórias para liberar o dashboard fiscal.',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/onboarding')
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    throw new Error(`Onboarding profile query failed: ${error.message}`)
  }

  const profile = data as UserProfileOnboarding | null

  if (isOnboardingComplete(profile)) {
    redirect('/dashboard')
  }

  const initialCnae = profile?.cnae_principal ? getCnae(profile.cnae_principal) ?? null : null

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg0)',
      color: 'var(--text1)',
      padding: '34px 24px 64px',
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={{ marginBottom: 28 }}>
          <Link href="/" style={{ color: 'var(--lime)', fontSize: 13, textDecoration: 'none' }}>
            Voltar ao início
          </Link>
          <h1 style={{
            fontSize: 'clamp(34px, 6vw, 72px)',
            lineHeight: 0.94,
            letterSpacing: 0,
            margin: '18px 0 12px',
            maxWidth: 850,
          }}>
            Antes do dashboard, precisamos calibrar seu MEI.
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.7, maxWidth: 680 }}>
            O SimulaMEI usa este pré-cadastro para montar o radar fiscal, salvar histórico e priorizar oportunidades. Os cards mudam de posição conforme ficam completos.
          </p>
        </header>

        <OnboardingWizard email={user.email ?? ''} profile={profile} initialCnae={initialCnae} />
      </div>
    </main>
  )
}
