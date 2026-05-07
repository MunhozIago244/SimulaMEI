import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { gerarOportunidadesFiscais } from '@/lib/tributario'
import { fmt, fmtPct } from '@/lib/format'
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

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    color: '#1f241f',
    fontSize: 10,
    lineHeight: 1.45,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 10,
    color: '#526052',
    marginBottom: 20,
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: '#d8dfd3',
    paddingTop: 14,
    marginTop: 14,
  },
  heading: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  metric: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: '#d8dfd3',
    padding: 10,
  },
  metricLabel: {
    color: '#526052',
    fontSize: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: 700,
  },
  paragraph: {
    marginBottom: 8,
  },
})

const PdfText = Text as React.ComponentType<{ style?: unknown; children?: React.ReactNode }>
const PdfView = View as React.ComponentType<{ style?: unknown; children?: React.ReactNode }>
const PdfPage = Page as React.ComponentType<{ size?: string; style?: unknown; children?: React.ReactNode }>
const PdfDocument = Document as React.ComponentType<{ children?: React.ReactNode }>

function PremiumReportDocument({
  email,
  profile,
  resultado,
  analysis,
}: {
  email: string
  profile: ProfileRow | null
  resultado: ResultadoSimulacao
  analysis: string
}) {
  const oportunidades = gerarOportunidadesFiscais(resultado)
  const text = (
    content: React.ReactNode,
    style: unknown = styles.paragraph,
    key?: string,
  ) =>
    React.createElement(PdfText, { key, style }, content)
  const section = (heading: string, children: React.ReactNode[], key: string) =>
    React.createElement(
      PdfView,
      { key, style: styles.section },
      text(heading, styles.heading),
      ...children,
    )

  return React.createElement(
    PdfDocument,
    null,
    React.createElement(
      PdfPage,
      { size: 'A4', style: styles.page },
      text('Relatório fiscal premium', styles.title),
      text(`SimulaMEI · ${email} · ${new Date().toLocaleDateString('pt-BR')}`, styles.subtitle),
      React.createElement(
        PdfView,
        { style: styles.metricGrid },
        ...[
          ['Negócio', profile?.nome_negocio ?? profile?.nome ?? 'Cliente SimulaMEI'],
          ['CNAE', profile?.cnae_principal ?? resultado.entrada.cnae],
          ['Uso do teto', fmtPct(resultado.alertaTeto.percentualUtilizado)],
        ].map(([label, value]) =>
          React.createElement(
            PdfView,
            { key: label, style: styles.metric },
            text(label, styles.metricLabel),
            text(value, styles.metricValue),
          ),
        ),
      ),
      section('Resumo numérico', [
        text(`Projeção anual: ${fmt(resultado.alertaTeto.projecaoAnual)}`, styles.paragraph, 'projecao'),
        text(`Teto aplicável: ${fmt(resultado.alertaTeto.tetoAnual)}`, styles.paragraph, 'teto'),
        text(`Anexo atual/provável: ${resultado.anexoAtual}`, styles.paragraph, 'anexo'),
        text(`Melhor regime estimado: ${resultado.comparativo.melhorRegime}`, styles.paragraph, 'regime'),
      ], 'resumo'),
      section('Atividades informadas', [
        text(profile?.atividades_realizadas ?? 'Não informado.', styles.paragraph, 'atividades'),
      ], 'atividades'),
      section('Análise gerada por IA',
        analysis.split('\n').filter(Boolean).map(line => text(line, styles.paragraph, line)),
        'analise',
      ),
      section('Oportunidades priorizadas',
        oportunidades.length > 0
          ? oportunidades.slice(0, 5).map(item =>
            text(
              `${item.titulo}: ${item.resumo} Impacto estimado: ${fmt(item.impactoEstimadoAnual)}/ano.`,
              styles.paragraph,
              item.id,
            ),
          )
          : [text('Nenhuma oportunidade automática foi identificada no cenário mais recente.', styles.paragraph, 'empty')],
        'oportunidades',
      ),
    ),
  )
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

  const hasAccess = profile?.plano === 'pro' || (purchases?.length ?? 0) > 0
  if (!hasAccess) {
    return NextResponse.json({ error: 'Pagamento ou Plano Pro obrigatório para gerar relatório premium.' }, { status: 403 })
  }

  const latest = (simulations?.[0] as SimulationRow | undefined)?.resultado
  if (!latest) {
    return NextResponse.json({ error: 'Nenhuma simulação encontrada para gerar o relatório.' }, { status: 404 })
  }

  let analysis: string
  try {
    analysis = await generateAiAnalysis(profile as ProfileRow | null, latest)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Claude API indisponível.'
    return NextResponse.json({ error: message }, { status: 503 })
  }

  const pdfElement = React.createElement(PremiumReportDocument, {
    email: user.email ?? 'cliente@simulamei.com.br',
    profile: profile as ProfileRow | null,
    resultado: latest,
    analysis,
  }) as unknown as React.ReactElement<DocumentProps>
  const buffer = await renderToBuffer(pdfElement)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="simulamei-relatorio-premium.pdf"',
    },
  })
}
