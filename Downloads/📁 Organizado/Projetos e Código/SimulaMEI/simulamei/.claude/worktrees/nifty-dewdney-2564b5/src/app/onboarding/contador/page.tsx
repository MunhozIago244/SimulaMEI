import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AccountantOnboardingWizard } from '@/components/onboarding/AccountantOnboardingWizard'
import { getCurrentAccountantOffice } from '@/lib/accountant/server'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Onboarding Contador — SimulaMEI',
  description: 'Crie o escritório contábil para gerenciar carteira MEI no SimulaMEI.',
}

export default async function AccountantOnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/onboarding/contador')
  }

  const { office, error } = await getCurrentAccountantOffice(supabase, user.id)
  if (error) {
    throw new Error(`Accountant onboarding office query failed: ${error}`)
  }

  if (office) {
    redirect('/contador')
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg0)',
      color: 'var(--text1)',
      padding: '34px 24px 64px',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ marginBottom: 28 }}>
          <Link href="/para-contadores" style={{ color: 'var(--lime)', fontSize: 13, textDecoration: 'none' }}>
            Voltar ao plano contador
          </Link>
          <h1 style={{
            fontSize: 'clamp(34px, 6vw, 68px)',
            lineHeight: 0.96,
            letterSpacing: 0,
            margin: '18px 0 12px',
            maxWidth: 850,
          }}>
            Configure o escritório antes da carteira.
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.7, maxWidth: 680 }}>
            Esta etapa cria o tenant contador, define o trial Starter e prepara a separação segura entre clientes, membros e simulações.
          </p>
        </header>

        <AccountantOnboardingWizard email={user.email ?? ''} />
      </div>
    </main>
  )
}
