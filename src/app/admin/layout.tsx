import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/auth/admin-access'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/admin/leads')
  }

  if (!isAdminEmail(user.email)) {
    redirect('/')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg0)', color: 'var(--text1)' }}>
      <nav style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg1)',
        padding: '0 32px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
      }}>
        <span style={{ fontWeight: 900, fontSize: 15 }}>Admin</span>
        <a href="/admin/leads" style={{ fontSize: 13, color: 'var(--text2)', textDecoration: 'none' }}>
          Leads contadores
        </a>
      </nav>
      <main>{children}</main>
    </div>
  )
}
