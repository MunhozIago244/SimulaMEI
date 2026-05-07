import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const DELETE_CONFIRMATION = 'EXCLUIR'

interface DeleteAccountPayload {
  confirmation?: unknown
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Autenticação obrigatória.' }, { status: 401 })
    }

    const body = await request.json().catch(() => null) as DeleteAccountPayload | null
    if (body?.confirmation !== DELETE_CONFIRMATION) {
      return NextResponse.json({ error: 'Confirmação inválida para exclusão da conta.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const normalizedEmail = user.email?.trim().toLowerCase() ?? null

    const { error: apiKeysError } = await admin
      .from('api_keys')
      .delete()
      .eq('user_id', user.id)

    if (apiKeysError) {
      console.error('[/api/account/delete] api_keys delete error:', apiKeysError.message)
      return NextResponse.json({ error: 'Não foi possível limpar as chaves da conta.' }, { status: 500 })
    }

    const { error: simulationsError } = await admin
      .from('simulations')
      .delete()
      .eq('user_id', user.id)

    if (simulationsError) {
      console.error('[/api/account/delete] simulations delete error:', simulationsError.message)
      return NextResponse.json({ error: 'Não foi possível remover as simulações da conta.' }, { status: 500 })
    }

    const { error: leadsByUserError } = await admin
      .from('leads')
      .delete()
      .eq('user_id', user.id)

    if (leadsByUserError) {
      console.error('[/api/account/delete] leads-by-user delete error:', leadsByUserError.message)
      return NextResponse.json({ error: 'Não foi possível remover os leads vinculados à conta.' }, { status: 500 })
    }

    if (normalizedEmail) {
      const { error: leadsByEmailError } = await admin
        .from('leads')
        .delete()
        .eq('email', normalizedEmail)

      if (leadsByEmailError) {
        console.error('[/api/account/delete] leads-by-email delete error:', leadsByEmailError.message)
        return NextResponse.json({ error: 'Não foi possível remover os leads associados ao e-mail.' }, { status: 500 })
      }
    }

    const { error: profileError } = await admin
      .from('user_profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      console.error('[/api/account/delete] profile delete error:', profileError.message)
      return NextResponse.json({ error: 'Não foi possível remover o perfil da conta.' }, { status: 500 })
    }

    const { error: authDeleteError } = await admin.auth.admin.deleteUser(user.id)

    if (authDeleteError) {
      console.error('[/api/account/delete] auth delete error:', authDeleteError.message)
      return NextResponse.json({ error: 'Não foi possível concluir a exclusão da conta.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[/api/account/delete] Error:', error)
    return NextResponse.json({ error: 'Erro interno ao excluir a conta.' }, { status: 500 })
  }
}
