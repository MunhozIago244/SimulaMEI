'use client'

import { useTransition } from 'react'
import { updateLeadStatus } from './actions'

const STATUS_OPTIONS = [
  { value: 'novo', label: 'Novo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'qualificado', label: 'Qualificado' },
  { value: 'descartado', label: 'Descartado' },
]

export function LeadStatusSelect({ id, current }: { id: string; current: string }) {
  const [isPending, startTransition] = useTransition()

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value
    startTransition(async () => {
      await updateLeadStatus(id, next)
    })
  }

  return (
    <select
      defaultValue={current}
      onChange={handleChange}
      disabled={isPending}
      style={{
        fontSize: 12,
        padding: '4px 8px',
        borderRadius: 6,
        border: '1px solid var(--border2)',
        background: 'var(--bg2)',
        color: 'var(--text1)',
        cursor: isPending ? 'wait' : 'pointer',
        opacity: isPending ? 0.6 : 1,
      }}
    >
      {STATUS_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
