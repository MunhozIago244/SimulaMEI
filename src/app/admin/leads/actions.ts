'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_STATUSES = ['novo', 'contactado', 'qualificado', 'descartado'] as const
type LeadStatus = typeof VALID_STATUSES[number]

function isValidStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && VALID_STATUSES.includes(value as LeadStatus)
}

export async function updateLeadStatus(id: string, status: string): Promise<{ error?: string }> {
  if (!id || !isValidStatus(status)) {
    return { error: 'Dados inválidos.' }
  }

  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('accountant_leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('[admin/leads] updateLeadStatus error:', error)
      return { error: error.message }
    }

    revalidatePath('/admin/leads')
    return {}
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[admin/leads] updateLeadStatus exception:', message)
    return { error: message }
  }
}
