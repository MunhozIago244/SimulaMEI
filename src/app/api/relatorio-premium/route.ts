import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { hasReportAccess } from '@/lib/auth/report-access'
import { gerarOportunidadesFiscais } from '@/lib/tributario'
import { SimulationReportDocument } from '@/lib/reports/SimulationReportDocument'
import type { ResultadoSimulacao } from '@/types/tributario'

interface SimulationRow {
  resultado: ResultadoSimulacao
}

interface ProfileRow {
  nome: string | null
  nome_negocio: string | null
  cnae_principal: string | null
  tipo_mei: string | null
  atividades_realizadas: string | null
  plano: string | null
}

async function generateAiAnalysis(profile: ProfileRow | null, latest: ResultadoSimulacao) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY ausente.')
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-latest',
    max_tokens: 900,
    temperature: 0.2,
    system: 'Você é um analista fiscal brasileiro. Gere orientação clara, cautelosa e acionável. Não substitua contador habilitado.',
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          perfil: profile,
          simulacao: latest,
          instrucoes: [
            'Escreva em português do Brasil.',
            'Use 5 a 8 parágrafos curtos.',
            'Priorize risco de teto MEI, Fator R, Anexo provável e próximos passos.',
            'Não invente dados ausentes.',
          ],
        }),
      },
    ],
  })

  return message.content
    .map(block => block.type === 'text' ? block.text : '')
    .join('\n')
    .trim()
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Autenticação obrigatória para gerar relatório premium.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({})) as { user_id?: string }
  if (body.user_id && body.user_id !== user.id) {
    return NextResponse.json({ error: 'user_id não pertence à sessão atual.' }, { status: 403 })
  }

  const [{ data: profile }, { data: purchases }, { data: simulations }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('nome,nome_negocio,cnae_principal,tipo_mei,atividades_realizadas,plano')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('produto', 'relatorio')
      .eq('status', 'paid')
      .limit(1),
    supabase
      .from('simulations')
      .select('resultado')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  const hasAccess = hasReportAccess(profile?.plano, purchases?.length ?? 0)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Pagamento ou Plano Pro obrigatório para gerar relatório premium.' }, { status: 403 })
  }

  const latest = (simulations?.[0] as SimulationRow | undefined)?.resultado
  if (!latest) {
    return NextResponse.json({ error: 'Nenhuma simulação encontrada para gerar o relatório.' }, { status: 404 })
  }

  try {
    await generateAiAnalysis(profile as ProfileRow | null, latest)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Claude API indisponível.'
    return NextResponse.json({ error: message }, { status: 503 })
  }

  const oportunidades = gerarOportunidadesFiscais(latest)
  const pdfElement = React.createElement(SimulationReportDocument, {
    email: user.email ?? 'cliente@simulamei.com.br',
    resultado: latest,
    oportunidades,
    variant: 'full',
  }) as unknown as React.ReactElement<DocumentProps>
  const buffer = await renderToBuffer(pdfElement)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="simulamei-relatorio-premium.pdf"',
    },
  })
}
