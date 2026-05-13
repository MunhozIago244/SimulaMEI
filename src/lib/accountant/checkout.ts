import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createBrandedCheckoutSession, isStripeConfigured } from '@/lib/stripe'
import { getCurrentAccountantOffice } from './server'
import {
  getAccountantStripeProduct,
  type AccountantPaidPlan,
} from './billing'

export async function createAccountantCheckout(plan: AccountantPaidPlan) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Autenticação obrigatória para assinar o plano contador.' },
      { status: 401 },
    )
  }

  const { office, error } = await getCurrentAccountantOffice(supabase, user.id, user.email)
  if (error) {
    console.error('[/api/checkout/accountant] office query error:', error)
    return NextResponse.json(
      { error: 'Não foi possível carregar o escritório contador.' },
      { status: 500 },
    )
  }

  if (!office) {
    return NextResponse.json(
      { error: 'Crie o escritório contador antes de assinar um plano.' },
      { status: 403 },
    )
  }

  if (office.role !== 'owner') {
    return NextResponse.json(
      { error: 'Apenas o owner do escritório pode alterar o plano.' },
      { status: 403 },
    )
  }

  const product = getAccountantStripeProduct(plan)
  if (!isStripeConfigured() || !product.priceId) {
    return NextResponse.json(
      { error: 'Stripe ainda não está configurado para planos contador neste ambiente.' },
      { status: 503 },
    )
  }

  const session = await createBrandedCheckoutSession({
    product: plan === 'pro' ? 'accountant_pro' : 'accountant_starter',
    userId: user.id,
    userEmail: user.email,
    mode: 'subscription',
    extraMetadata: {
      office_id: office.id,
      plan,
    },
  })

  if (!session.url) {
    return NextResponse.json(
      { error: 'Stripe não retornou uma URL de checkout.' },
      { status: 502 },
    )
  }

  const admin = createAdminClient()
  const subscriptions = admin.from('office_subscriptions') as unknown as {
    upsert(
      payload: Record<string, unknown>,
      options: { onConflict: string },
    ): Promise<{ error: { message: string } | null }>
  }
  const { error: subscriptionError } = await subscriptions.upsert({
    office_id: office.id,
    status: 'pending',
    plan,
    stripe_checkout_session_id: session.id,
  }, { onConflict: 'office_id' })

  if (subscriptionError) {
    console.error('[/api/checkout/accountant] pending subscription error:', subscriptionError.message)
    return NextResponse.json(
      { error: 'Checkout criado, mas não foi possível registrar a assinatura pendente.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ url: session.url })
}
