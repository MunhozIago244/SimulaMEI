import type { NextRequest } from 'next/server'
import { createAccountantCheckout } from '@/lib/accountant/checkout'

export async function POST(request: NextRequest) {
  void request
  return createAccountantCheckout('starter')
}
