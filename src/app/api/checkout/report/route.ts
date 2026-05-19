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

  try {
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
  } catch (err) {
    // Sem isto, qualquer falha do Stripe (ex.: price de modo/conta errados)
    // virava 500 não tratado → o CheckoutButton só mostrava o fallback
    // genérico "Checkout indisponível neste ambiente". Agora retorna o
    // motivo real (mensagem do Stripe é descritiva e não expõe segredos)
    // e loga no runtime pra diagnóstico.
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[checkout/report] falha ao criar sessão Stripe:', detail)
    return NextResponse.json(
      { error: `Falha ao iniciar o checkout: ${detail}` },
      { status: 502 },
    )
  }
}
