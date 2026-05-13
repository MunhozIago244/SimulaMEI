'use client'

import posthog from 'posthog-js'

export type ProductEventName =
  | 'simulation_started'
  | 'simulation_completed'
  | 'email_captured'
  | 'fator_r_explored'
  | 'pdf_cta_clicked'
  | 'report_purchased'
  | 'monitor_waitlist_joined'
  | 'pro_upgrade_from_relatorio'
  | 'accountant_demo_requested'
  | 'accountant_signup_interest'
  | 'accountant_checkout_started'
  | 'accountant_billing_portal_opened'

export function captureProductEvent(
  event: ProductEventName,
  properties: Record<string, unknown> = {},
) {
  if (typeof window === 'undefined' || !posthog.__loaded) {
    return
  }

  posthog.capture(event, properties)
}
