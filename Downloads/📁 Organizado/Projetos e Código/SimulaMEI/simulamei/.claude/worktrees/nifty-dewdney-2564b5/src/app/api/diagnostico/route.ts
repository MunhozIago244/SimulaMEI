import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gerarDiagnosticoFiscal } from '@/lib/ai/diagnostico'
import type { ResultadoSimulacao } from '@/types/tributario'

interface SimulationRow {
  resultado: ResultadoSimulacao
}

// POST /api/diagnostico
// Body: { resultado: ResultadoSimulacao } — usa os dados enviados diretamente
// GET  /api/diagnostico — busca a última simulação do usuário autenticado
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { resultado?: ResultadoSimulacao }

    if (!body.resultado) {
      return NextResponse.json(
        { error: 'Campo resultado é obrigatório.' },
        { status: 400 },
      )
    }

    const diagnostico = await gerarDiagnosticoFiscal(body.resultado)
    return NextResponse.json(diagnostico)
  } catch (err) {
    console.error('[/api/diagnostico] POST error:', err)
    return NextResponse.json({ error: 'Erro ao gerar diagnóstico fiscal.' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Autenticação obrigatória.' }, { status: 401 })
    }

    const { data: simulations } = await supabase
      .from('simulations')
      .select('resultado')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    const latest = (simulations?.[0] as SimulationRow | undefined)?.resultado
    if (!latest) {
      return NextResponse.json({ error: 'Nenhuma simulação encontrada.' }, { status: 404 })
    }

    const diagnostico = await gerarDiagnosticoFiscal(latest)
    return NextResponse.json(diagnostico)
  } catch (err) {
    console.error('[/api/diagnostico] GET error:', err)
    return NextResponse.json({ error: 'Erro ao gerar diagnóstico fiscal.' }, { status: 500 })
  }
}
