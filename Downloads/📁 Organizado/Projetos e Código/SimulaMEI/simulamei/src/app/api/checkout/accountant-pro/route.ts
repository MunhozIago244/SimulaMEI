import { createAccountantCheckout } from '@/lib/accountant/checkout'

export async function POST() {
  return createAccountantCheckout('pro')
}
