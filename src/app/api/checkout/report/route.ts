import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBrandedCheckoutSession, isStripeConfigured, STRIPE_PRODUCTS } from '@/lib/stripe'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Autenticação obrigatória para comprar o relatório.' }, { status: 401 })
  }

  if (!isStripeConfigured() || !STRIPE_PRODUCTS.relatorio.priceId) {
    return NextResponse.json({ error: 'Stripe ainda não está configurado neste ambiente.' }, { status: 503 })
  }

  const session = await createBrandedCheckoutSession({
    product: 'relatorio',
    userId: user.id,
    userEmail: user.email,
    mode: 'payment',
  })

  await supabase.from('purchases').insert({
    user_id: user.id,
    produto: STRIPE_PRODUCTS.relatorio.product,
    status: 'pending',
    valor_centavos: STRIPE_PRODUCTS.relatorio.valorCentavos,
    stripe_session_id: session.id,
  })

  return NextResponse.json({ url: session.url })
}
