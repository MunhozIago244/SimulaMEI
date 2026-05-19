import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBrandedCheckoutSession, isStripeConfigured, STRIPE_PRODUCTS } from '@/lib/stripe'
import { reportFingerprint } from '@/lib/reports/reportFingerprint'
import { isResultadoVazio } from '@/lib/reports/reportEligibility'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Autenticação obrigatória para comprar o relatório.' }, { status: 401 })
  }

  if (!isStripeConfigured() || !STRIPE_PRODUCTS.relatorio.priceId) {
    return NextResponse.json({ error: 'Stripe ainda não está configurado neste ambiente.' }, { status: 503 })
  }

  const { data: sims } = await supabase
    .from('simulations')
    .select('id, resultado')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
  const sim = sims?.[0] as { id: string; resultado: { entrada?: unknown } } | undefined
  if (!sim || isResultadoVazio(sim.resultado as never)) {
    return NextResponse.json({ error: 'Refaça a simulação com seus dados antes de pagar o relatório.' }, { status: 422 })
  }
  const fingerprint = reportFingerprint((sim.resultado as { entrada?: never }).entrada)

  try {
    const session = await createBrandedCheckoutSession({
      product: 'relatorio',
      userId: user.id,
      userEmail: user.email,
      mode: 'payment',
      extraMetadata: { report_fingerprint: fingerprint, simulation_id: sim.id },
    })

    await supabase.from('purchases').insert({
      user_id: user.id,
      produto: STRIPE_PRODUCTS.relatorio.product,
      status: 'pending',
      valor_centavos: STRIPE_PRODUCTS.relatorio.valorCentavos,
      stripe_session_id: session.id,
      report_fingerprint: fingerprint,
      simulation_id: sim.id,
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
