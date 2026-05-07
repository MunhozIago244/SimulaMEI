import Stripe from 'stripe'
import { getSiteUrl } from '@/constants/site'

let stripeClient: Stripe | null = null

export const STRIPE_PRODUCTS = {
  relatorio: {
    product: 'relatorio',
    priceId: process.env.STRIPE_PRICE_REPORT_ID ?? '',
    valorCentavos: 2900,
    successPath: '/relatorio?checkout=success',
    cancelPath: '/relatorio?checkout=cancel',
  },
  monitor_mensal: {
    product: 'monitor_mensal',
    priceId: process.env.STRIPE_PRICE_MONITOR_ID ?? '',
    valorCentavos: 1900,
    successPath: '/upgrade?checkout=success',
    cancelPath: '/upgrade?checkout=cancel',
  },
  accountant_starter: {
    product: 'accountant_starter',
    priceId: process.env.STRIPE_PRICE_ACCOUNTANT_STARTER_ID ?? '',
    valorCentavos: 9700,
    successPath: '/upgrade/contador?checkout=success&plan=starter',
    cancelPath: '/upgrade/contador?checkout=cancel&plan=starter',
  },
  accountant_pro: {
    product: 'accountant_pro',
    priceId: process.env.STRIPE_PRICE_ACCOUNTANT_PRO_ID ?? '',
    valorCentavos: 24700,
    successPath: '/upgrade/contador?checkout=success&plan=pro',
    cancelPath: '/upgrade/contador?checkout=cancel&plan=pro',
  },
} as const

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured.')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      maxNetworkRetries: 2,
    })
  }

  return stripeClient
}

export function getCheckoutUrl(path: string) {
  return `${getSiteUrl()}${path}`
}
