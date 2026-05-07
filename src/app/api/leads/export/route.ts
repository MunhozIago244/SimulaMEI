import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { canAccessAdminLeads, getProfileAccess } from '@/lib/auth/profile-access'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

interface AccountantLeadExportRow {
  nome_escritorio: string | null
  email: string | null
  telefone: string | null
  carteira_range: string | null
  ferramenta_atual: string | null
  status: string | null
  created_at: string | null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Autenticação obrigatória.' }, { status: 401 })
  }

  const access = await getProfileAccess(supabase, user)
  if (!canAccessAdminLeads(access.profile, user)) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('accountant_leads')
    .select('nome_escritorio,email,telefone,carteira_range,ferramenta_atual,status,created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[/api/leads/export] fetch error:', error.message)
    return NextResponse.json({ error: 'Não foi possível exportar leads.' }, { status: 500 })
  }

  const rows = ((data ?? []) as AccountantLeadExportRow[]).map(lead => ({
    nome: lead.nome_escritorio ?? '',
    CNPJ: '',
    email: lead.email ?? '',
    regime: '',
    faturamento_mensal: '',
    telefone: lead.telefone ?? '',
    carteira_range: lead.carteira_range ?? '',
    ferramenta_atual: lead.ferramenta_atual ?? '',
    status: lead.status ?? '',
    criado_em: lead.created_at ?? '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{
    nome: '',
    CNPJ: '',
    email: '',
    regime: '',
    faturamento_mensal: '',
    telefone: '',
    carteira_range: '',
    ferramenta_atual: '',
    status: '',
    criado_em: '',
  }])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'leads')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="simulamei-leads.xlsx"',
    },
  })
}
