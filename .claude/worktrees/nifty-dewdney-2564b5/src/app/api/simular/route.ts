import { NextRequest, NextResponse } from 'next/server'
import type { EntradaSimulacao } from '@/types/tributario'
import { simular } from '@/lib/tributario'
import { getCnae, normalizeCnaeCode } from '@/lib/tributario'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_RATE_LIMITS } from '@/constants/security'
import { applyRateLimitHeaders, consumeRateLimit } from '@/lib/security/rate-limit'
import { hashIpAddress } from '@/lib/security/hash'
import { getClientIp, getUserAgent } from '@/lib/security/request'

type SimularPayload = Partial<EntradaSimulacao> & {
  faturamentoAnual?: unknown
}

function isTipoMei(value: unknown): value is EntradaSimulacao['tipoMei'] {
  return value === 'geral' || value === 'caminhoneiro'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SimularPayload
    const ipHash = hashIpAddress(getClientIp(req))
    const rateLimit = await consumeRateLimit({
      namespace: 'simulations',
      subjectHash: ipHash,
      limit: PUBLIC_RATE_LIMITS.simulations.limit,
      windowSeconds: PUBLIC_RATE_LIMITS.simulations.windowSeconds,
    })

    if (!rateLimit.allowed) {
      return applyRateLimitHeaders(
        NextResponse.json({ error: 'Limite de simulações atingido. Tente novamente mais tarde.' }, { status: 429 }),
        rateLimit,
        PUBLIC_RATE_LIMITS.simulations.limit,
      )
    }

    if (typeof body.faturamentoAnual !== 'undefined') {
      return NextResponse.json(
        { error: 'Use faturamentoAcumulado. O campo faturamentoAnual nao e mais aceito nesta API.' },
        { status: 400 },
      )
    }

    const { faturamentoAcumulado, mesAtual, cnae, folhaMensal, tipoMei } = body

    if (
      typeof faturamentoAcumulado !== 'number' ||
      !Number.isFinite(faturamentoAcumulado) ||
      typeof mesAtual !== 'number' ||
      !Number.isInteger(mesAtual) ||
      typeof cnae !== 'string' ||
      typeof folhaMensal !== 'number' ||
      !Number.isFinite(folhaMensal) ||
      !isTipoMei(tipoMei)
    ) {
      return NextResponse.json(
        { error: 'Campos inválidos. Verifique faturamentoAcumulado, mesAtual, cnae, folhaMensal e tipoMei.' },
        { status: 400 },
      )
    }

    if (mesAtual < 1 || mesAtual > 12) {
      return NextResponse.json({ error: 'mesAtual deve ser entre 1 e 12.' }, { status: 400 })
    }

    if (faturamentoAcumulado < 0 || folhaMensal < 0) {
      return NextResponse.json({ error: 'Valores monetários não podem ser negativos.' }, { status: 400 })
    }

    const normalizedCnae = normalizeCnaeCode(cnae)
    if (!getCnae(normalizedCnae)) {
      return NextResponse.json({ error: 'CNAE não reconhecido. Informe um código oficial válido.' }, { status: 400 })
    }

    const entrada: EntradaSimulacao = {
      faturamentoAcumulado,
      mesAtual,
      cnae: normalizedCnae,
      folhaMensal,
      tipoMei,
    }

    const resultado = simular(entrada)

    // Persiste simulação no Supabase (não-bloqueante)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('simulations')
      .insert({
        user_id: user?.id ?? null,
        entrada,
        resultado,
        ip_hash: ipHash,
        user_agent: getUserAgent(req),
      })
    if (error) console.error('[/api/simular] Supabase insert error:', error.message)

    return applyRateLimitHeaders(
      NextResponse.json(resultado),
      rateLimit,
      PUBLIC_RATE_LIMITS.simulations.limit,
    )
  } catch (err) {
    console.error('[/api/simular] Error:', err)
    return NextResponse.json({ error: 'Erro interno ao processar a simulação.' }, { status: 500 })
  }
}
