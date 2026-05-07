import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCheckoutUrl, getStripeClient, isStripeConfigured, STRIPE_PRODUCTS } from '@/lib/stripe'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Autenticação obrigatória para assinar o monitor.' }, { status: 401 })
  }

  if (!isStripeConfigured() || !STRIPE_PRODUCTS.monitor_mensal.priceId) {
    return NextResponse.json({ error: 'Stripe ainda não está configurado neste ambiente.' }, { status: 503 })
  }

  const session = await getStripeClient().checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email ?? undefined,
    line_items: [
      {
        price: STRIPE_PRODUCTS.monitor_mensal.priceId,
        quantity: 1,
      },
    ],
    success_url: getCheckoutUrl(STRIPE_PRODUCTS.monitor_mensal.successPath),
    cancel_url: getCheckoutUrl(STRIPE_PRODUCTS.monitor_mensal.cancelPath),
    metadata: {
      user_id: user.id,
      produto: STRIPE_PRODUCTS.monitor_mensal.product,
    },
  })

  await supabase.from('purchases').insert({
    user_id: user.id,
    produto: STRIPE_PRODUCTS.monitor_mensal.product,
    status: 'pending',
    valor_centavos: STRIPE_PRODUCTS.monitor_mensal.valorCentavos,
    stripe_session_id: session.id,
  })

  return NextResponse.json({ url: session.url })
}
