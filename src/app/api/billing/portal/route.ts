import { NextResponse } from 'next/server'
import { getCurrentAccountantOffice } from '@/lib/accountant/server'
import { createClient } from '@/lib/supabase/server'
import { getCheckoutUrl, getStripeClient, isStripeConfigured } from '@/lib/stripe'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Autenticação obrigatória.' }, { status: 401 })
  }

  const { office, error } = await getCurrentAccountantOffice(supabase, user.id, user.email)
  if (error) {
    console.error('[/api/billing/portal] office query error:', error)
    return NextResponse.json({ error: 'Não foi possível carregar o escritório contador.' }, { status: 500 })
  }

  if (!office) {
    return NextResponse.json({ error: 'Escritório contador não configurado.' }, { status: 403 })
  }

  if (!office.stripe_customer_id) {
    return NextResponse.json({ error: 'Este escritório ainda não tem assinatura ativa no Stripe.' }, { status: 409 })
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe ainda não está configurado neste ambiente.' }, { status: 503 })
  }

  const session = await getStripeClient().billingPortal.sessions.create({
    customer: office.stripe_customer_id,
    return_url: getCheckoutUrl('/upgrade/contador'),
  })

  return NextResponse.json({ url: session.url })
}
