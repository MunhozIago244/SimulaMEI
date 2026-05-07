import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import { logoutAction } from '@/app/auth/logout/action'
import { createClient } from '@/lib/supabase/server'
import {
  CNAE_OFICIAL_TOTAL,
  TAX_RULE_VERSION,
  gerarOportunidadesFiscais,
  getCnae,
} from '@/lib/tributario'
import { FatorRInterativo } from '@/components/resultado/FatorRInterativo'
import { summarizeMonthlyMonitor, detectAnexoTransition, getFiscalCalendarItems } from '@/lib/monitor'
import { REGIME_LABELS } from '@/constants/tributario'
import { FREE_SIMULATION_LIMIT, PLAN_ACCENT_COLORS, PLAN_DESCRIPTIONS, PLAN_LABELS } from '@/constants/plans'
import { DeleteAccountSection } from '@/components/dashboard/DeleteAccountSection'
import { MonthlyMonitorSection } from '@/components/dashboard/MonthlyMonitorSection'
import { Panel } from '@/components/dashboard/Panel'
import { Pill } from '@/components/dashboard/Pill'
import { isAdminEmail } from '@/lib/auth/admin-access'
import { fmt, fmtPct } from '@/lib/format'
import { isOnboardingComplete, type UserProfileOnboarding } from '@/lib/onboarding'
import type { ResultadoSimulacao } from '@/types/tributario'

export const metadata = {
  title: 'Dashboard — SimulaMEI',
  description: 'Área logada do SimulaMEI.',
}

interface SimulationRow {
  id: string
  created_at: string
  entrada: ResultadoSimulacao['entrada']
  resultado: ResultadoSimulacao
}

interface MonthlyInputRow {
  id: string
  ano: number
  mes: number
  faturamento_mes: number
  folha_mes: number
  rbt12: number | null
  projecao_anual: number | null
  fator_r: number | null
  anexo_calculado: string | null
  cnae: string | null
  tipo_mei: string | null
  tax_rule_version: string | null
  created_at: string
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

function formatDate(value?: string) {
  if (!value) return 'Sem data'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function metricTone(value: 'ok' | 'warn' | 'danger' | 'neutral') {
  return {
    ok: 'var(--lime)',
    warn: 'var(--yellow)',
    danger: 'var(--red)',
    neutral: 'var(--blue)',
  }[value]
}

async function getRecentSimulations(supabase: SupabaseServerClient, userId: string) {
  const { data, error } = await supabase
    .from('simulations')
    .select('id, created_at, entrada, resultado')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) {
    return {
      rows: [] as SimulationRow[],
      error: error.message,
    }
  }

  return {
    rows: (data ?? []) as SimulationRow[],
    error: null,
  }
}

async function getSimulationUsageCount(supabase: SupabaseServerClient, userId: string) {
  const { count, error } = await supabase
    .from('simulations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    return {
      count: 0,
      error: error.message,
    }
  }

  return {
    count: count ?? 0,
    error: null,
  }
}

async function getMonthlyInputs(supabase: SupabaseServerClient, userId: string) {
  const { data, error } = await supabase
    .from('monthly_inputs')
    .select('id, ano, mes, faturamento_mes, folha_mes, rbt12, projecao_anual, fator_r, anexo_calculado, cnae, tipo_mei, tax_rule_version, created_at')
    .eq('user_id', userId)
    .order('ano', { ascending: false })
    .order('mes', { ascending: false })
    .limit(12)

  if (error) {
    return {
      rows: [] as MonthlyInputRow[],
      error: error.message,
    }
  }

  return {
    rows: (data ?? []) as MonthlyInputRow[],
    error: null,
  }
}

async function getCachedOportunidades(simulation: SimulationRow | undefined) {
  if (!simulation) return []

  return unstable_cache(
    async () => gerarOportunidadesFiscais(simulation.resultado),
    ['dashboard-oportunidades-v1', simulation.id],
    { revalidate: 60 * 60 },
  )()
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/dashboard')
  }

  const [profileResult, simulationsResult, usageResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle(),
    getRecentSimulations(supabase, user.id),
    getSimulationUsageCount(supabase, user.id),
  ])

  if (profileResult.error) {
    throw new Error(`Dashboard profile query failed: ${profileResult.error.message}`)
  }

  const profileData = profileResult.data

  const hasFullAdminAccess = isAdminEmail(user.email)

  if (!hasFullAdminAccess && !isOnboardingComplete(profileData as UserProfileOnboarding | null)) {
    redirect('/onboarding')
  }

  const { rows: simulations, error: simulationsError } = simulationsResult
  const { rows: monthlyInputs, error: monthlyInputsError } = await getMonthlyInputs(supabase, user.id)
  const profile = profileData as UserProfileOnboarding | null
  const currentPlan = profile?.plano ?? 'free'
  const simulationsUsed = usageResult.error ? simulations.length : usageResult.count
  const freeSimulationLimitReached = currentPlan === 'free' && simulationsUsed >= FREE_SIMULATION_LIMIT
  const latestSimulation = simulations[0]
  const latest = latestSimulation?.resultado
  const latestCnae = latest ? getCnae(latest.entrada.cnae) : null
  const oportunidades = await getCachedOportunidades(latestSimulation)
  const impactoTotal = oportunidades.reduce((sum, item) => sum + item.impactoEstimadoAnual, 0)
  const usoTeto = latest?.alertaTeto.percentualUtilizado ?? 0
  const tetoTone = !latest ? 'neutral' : latest.alertaTeto.cenario === 'excesso_grave'
    ? 'danger'
    : latest.alertaTeto.cenario === 'excesso_leve' || usoTeto >= 0.85
      ? 'warn'
      : 'ok'

  const monitoredCnaes = new Set(simulations.map(item => item.entrada?.cnae).filter(Boolean)).size
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const monitorRows = monthlyInputs
    .map(item => ({
      ano: item.ano,
      mes: item.mes,
      faturamentoMes: Number(item.faturamento_mes),
      folhaMes: Number(item.folha_mes),
      anexoCalculado: item.anexo_calculado,
      fatorR: item.fator_r,
    }))
    .sort((a, b) => (a.ano * 100 + a.mes) - (b.ano * 100 + b.mes))
  const monitorSeedRows = monitorRows.length > 0
    ? monitorRows
    : profile?.cnae_principal && profile?.tipo_mei
      ? [{
        ano: currentYear,
        mes: profile.mes_atual ?? currentMonth,
        faturamentoMes: profile.faturamento_mensal_estimado ?? 0,
        folhaMes: profile.folha_mensal ?? 0,
      }]
      : []
  const monitorSummary = profile?.cnae_principal && profile?.tipo_mei && monitorSeedRows.length > 0
    ? summarizeMonthlyMonitor({
      cnae: profile.cnae_principal,
      tipoMei: profile.tipo_mei,
      mesAtual: monitorSeedRows.at(-1)?.mes ?? currentMonth,
      historico: monitorSeedRows,
    })
    : null
  const monitorTransition = detectAnexoTransition(monitorRows)
  const calendarItems = getFiscalCalendarItems({
    mes: monitorRows.at(-1)?.mes ?? profile?.mes_atual ?? currentMonth,
    nome: profile?.nome ?? user.email?.split('@')[0] ?? 'Sua conta',
    tipoMei: profile?.tipo_mei ?? 'geral',
    anexoAtual: latest?.anexoAtual ?? 'III',
    elegivelFatorR: Boolean(latest?.fatorR),
  })
  const completedPerspectiveCount = [
    Boolean(latest),
    oportunidades.length > 0,
    monitoredCnaes > 0,
    !simulationsError,
  ].filter(Boolean).length

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg0)',
      color: 'var(--text1)',
      padding: '32px 24px 56px',
    }}>
      <div style={{ maxWidth: 1220, margin: '0 auto' }}>
        <header className="dashboard-header" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 24,
          alignItems: 'start',
          marginBottom: 28,
        }}>
          <div>
            <Link href="/" className="quiet-link">
              Voltar ao simulador
            </Link>
            <h1 style={{
              fontSize: 'clamp(28px, 6vw, 56px)',
              margin: '14px 0 10px',
              lineHeight: 0.96,
              letterSpacing: 0,
              maxWidth: 760,
            }}>
              Central fiscal do seu MEI
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7, maxWidth: 700 }}>
              {user.email} · Motor {TAX_RULE_VERSION} · {CNAE_OFICIAL_TOTAL.toLocaleString('pt-BR')} CNAEs oficiais monitorados
            </p>
          </div>

          <div className="dashboard-header-actions" style={{ display: 'grid', gap: 12, justifyItems: 'end' }}>
            <Pill color={PLAN_ACCENT_COLORS[currentPlan]}>
              {PLAN_LABELS[currentPlan]}
            </Pill>
            <form action={logoutAction}>
              <button
                type="submit"
                className="dashboard-action dashboard-secondary-action"
                style={{
                  padding: '10px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Sair
              </button>
            </form>
          </div>
        </header>

        <section className="dashboard-hero-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 0.75fr',
          gap: 16,
          marginBottom: 16,
        }}>
          <Panel style={{ padding: 28, minHeight: 260 }}>
            <div className="dashboard-radar-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start', marginBottom: 26 }}>
              <div>
                <Pill color={metricTone(tetoTone)}>Radar principal</Pill>
                <h2 style={{ fontSize: 28, lineHeight: 1.05, margin: '14px 0 8px', maxWidth: 620 }}>
                  {latest
                    ? latest.alertaTeto.cenario === 'dentro_limite'
                      ? 'Seu cenário mais recente ainda cabe no MEI'
                      : 'Seu cenário mais recente exige atenção tributária'
                    : 'Faça a primeira simulação para ativar o radar'}
                </h2>
                <p style={{ color: 'var(--text2)', lineHeight: 1.7, fontSize: 14, maxWidth: 620 }}>
                  {latest
                    ? `Última simulação: CNAE ${latest.entrada.cnae}${latestCnae ? ` · ${latestCnae.descricao}` : ''}.`
                    : 'O dashboard nasce das simulações. Depois da primeira análise, ele passa a acompanhar teto MEI, Fator R, regime mais barato e oportunidades.'}
                </p>
              </div>
              <div className="dashboard-radar-score" style={{ textAlign: 'right', minWidth: 150 }}>
                <div style={{ color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', fontWeight: 800, marginBottom: 6 }}>
                  Uso do teto
                </div>
                <div style={{
                  fontFamily: 'var(--mono)',
                  color: metricTone(tetoTone),
                  fontSize: 42,
                  fontWeight: 800,
                  lineHeight: 1,
                }}>
                  {latest ? fmtPct(usoTeto) : '0,0%'}
                </div>
              </div>
            </div>

            <div
              role="progressbar"
              aria-label="Uso do teto MEI"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(Math.min(100, Math.max(0, usoTeto * 100)) * 10) / 10}
              style={{
              height: 12,
              background: 'var(--bg2)',
              borderRadius: 999,
              border: '1px solid var(--border)',
              overflow: 'hidden',
              marginBottom: 22,
            }}>
              <div style={{
                width: `${Math.min(100, Math.max(0, usoTeto * 100))}%`,
                height: '100%',
                background: metricTone(tetoTone),
                borderRadius: 999,
              }} />
            </div>

            <div className="dashboard-radar-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              {[
                ['Projeção anual', latest ? fmt(latest.alertaTeto.projecaoAnual) : 'Sem dados'],
                ['Melhor regime', latest ? REGIME_LABELS[latest.comparativo.melhorRegime] : 'Aguardando'],
                ['Impacto estimado', impactoTotal > 0 ? `${fmt(impactoTotal)}/ano` : latest ? 'Sem economia clara' : 'Aguardando'],
              ].map(([label, value]) => (
                <div key={label} className="metric-card">
                  <div className="metric-card-label">
                    {label}
                  </div>
                  <div className="metric-card-value">{value}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel style={{ padding: 24 }}>
            <Pill color="var(--blue)">Perspectivas</Pill>
            <h2 style={{ fontSize: 22, lineHeight: 1.1, margin: '14px 0 18px' }}>
              Maturidade do sistema
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                ['Simulação fiscal', latest ? 'ativa' : 'pendente'],
                ['Oportunidades', oportunidades.length ? `${oportunidades.length} achadas` : 'sem leitura'],
                ['CNAEs monitorados', monitoredCnaes ? `${monitoredCnaes} nesta conta` : 'sem histórico'],
                ['Fonte oficial', simulationsError ? 'schema pendente' : 'operacional'],
              ].map(([label, status]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text2)', fontSize: 13 }}>{label}</span>
                  <strong style={{ color: 'var(--text1)', fontSize: 13 }}>{status}</strong>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, fontFamily: 'var(--mono)', fontSize: 34, color: 'var(--lime)', fontWeight: 800 }}>
              {completedPerspectiveCount}/4
            </div>
            <p style={{ color: 'var(--text3)', fontSize: 12, lineHeight: 1.6, marginTop: 6 }}>
              Quanto mais dados de simulação, mais forte fica o diagnóstico mensal.
            </p>
          </Panel>
        </section>

        <section className="dashboard-kpi-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 16,
          marginBottom: 16,
        }}>
          {[
            ['Simulações', simulations.length.toString(), 'histórico salvo'],
            ['CNAEs', monitoredCnaes.toString(), 'usados nesta conta'],
            ['Alertas', latest && latest.alertaTeto.cenario !== 'dentro_limite' ? '1' : '0', 'teto MEI'],
            ['Oportunidades', oportunidades.length.toString(), impactoTotal > 0 ? fmt(impactoTotal) : 'sem economia'],
          ].map(([label, value, detail]) => (
            <Panel key={label} className="surface-hover" style={{ padding: 20 }}>
              <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
                {label}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 32, color: 'var(--text1)', fontWeight: 800, lineHeight: 1 }}>
                {value}
              </div>
              <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 8 }}>{detail}</div>
            </Panel>
          ))}
        </section>

        <section className="dashboard-main-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 16,
        }}>
          <Panel style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 18 }}>
              <div>
                <Pill color="var(--lime)">Motor de oportunidades</Pill>
                <h2 style={{ fontSize: 22, margin: '12px 0 0' }}>Próximas melhores ações</h2>
              </div>
              <Link
                href={freeSimulationLimitReached ? '/upgrade' : '/#simulador'}
                className="dashboard-action dashboard-primary-action"
                style={{
                  padding: '10px 13px',
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                }}
              >
                {freeSimulationLimitReached ? 'Fazer upgrade' : 'Nova simulação'}
              </Link>
            </div>

            {currentPlan === 'free' && (
              <div style={{
                marginBottom: 16,
                padding: '13px 14px',
                borderRadius: 'var(--radius)',
                border: `1px solid ${freeSimulationLimitReached ? 'rgba(255,74,74,0.28)' : 'var(--border)'}`,
                background: freeSimulationLimitReached ? 'rgba(255,74,74,0.08)' : 'var(--bg2)',
                color: freeSimulationLimitReached ? 'var(--red)' : 'var(--text2)',
                fontSize: 13,
                lineHeight: 1.55,
              }}>
                {simulationsUsed} de {FREE_SIMULATION_LIMIT} simulações usadas no Plano Free.
                {freeSimulationLimitReached && (
                  <strong style={{ color: 'var(--text1)' }}> Faça upgrade para liberar novas análises.</strong>
                )}
              </div>
            )}

            {oportunidades.length > 0 ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {oportunidades.slice(0, 3).map(item => (
                  <article key={item.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      <Pill color={item.prioridade === 'alta' ? 'var(--lime)' : 'var(--yellow)'}>
                        {item.prioridade}
                      </Pill>
                      <Pill>{item.confianca}</Pill>
                    </div>
                    <h3 style={{ fontSize: 15, margin: '0 0 6px', lineHeight: 1.3 }}>{item.titulo}</h3>
                    <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{item.resumo}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 18 }}>
                <h3 style={{ fontSize: 16, margin: '0 0 8px' }}>Ainda sem oportunidade calculada</h3>
                <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                  Rode uma simulação com faturamento, CNAE e folha para o motor gerar economia potencial, alerta de teto e comparativo de regimes.
                </p>
              </div>
            )}
          </Panel>

          <Panel style={{ padding: 24 }}>
            <Pill color="var(--blue)">Histórico</Pill>
            <h2 style={{ fontSize: 22, margin: '12px 0 18px' }}>Últimas simulações</h2>

            {simulationsError ? (
              <div style={{ background: 'rgba(255,204,0,0.08)', border: '1px solid rgba(255,204,0,0.24)', borderRadius: 'var(--radius)', padding: 16 }}>
                <h3 style={{ fontSize: 15, margin: '0 0 8px', color: 'var(--yellow)' }}>Schema pendente no Supabase</h3>
                <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                  Não consegui ler a tabela <strong>simulations</strong>. O dashboard continua funcional, mas o histórico precisa da tabela e das políticas RLS.
                </p>
              </div>
            ) : simulations.length > 0 ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {simulations.map(item => (
                  <div key={item.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 12,
                    alignItems: 'center',
                    padding: '13px 0',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{item.entrada.cnae}</div>
                      <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>
                        {formatDate(item.created_at)} · {fmt(item.resultado.alertaTeto.projecaoAnual)} projetado
                      </div>
                    </div>
                    <Pill color={item.resultado.alertaTeto.cenario === 'dentro_limite' ? 'var(--lime)' : 'var(--yellow)'}>
                      {item.resultado.alertaTeto.cenario.replace('_', ' ')}
                    </Pill>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 18 }}>
                <h3 style={{ fontSize: 16, margin: '0 0 8px' }}>Nenhuma simulação salva ainda</h3>
                <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                  Faça uma simulação logado para começar o histórico e ativar o acompanhamento mensal.
                </p>
              </div>
            )}
          </Panel>
        </section>

        <section className="dashboard-main-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 16,
        }}>
          <Panel style={{ padding: 24 }}>
            <Pill color="var(--lime)">Monitor recorrente</Pill>
            <h2 style={{ fontSize: 22, margin: '12px 0 18px' }}>Rotina mensal do regime</h2>
            {profile?.cnae_principal && profile?.tipo_mei ? (
              <MonthlyMonitorSection
                cnae={profile.cnae_principal}
                tipoMei={profile.tipo_mei}
                defaultMonth={profile.mes_atual ?? currentMonth}
                defaultYear={currentYear}
                defaultRevenue={profile.faturamento_mensal_estimado ?? 0}
                defaultPayroll={profile.folha_mensal ?? 0}
                initialSummary={monitorSummary}
                initialTransition={monitorTransition}
                recentRows={monthlyInputs.map(item => ({
                  ano: item.ano,
                  mes: item.mes,
                  faturamentoMes: Number(item.faturamento_mes),
                  folhaMes: Number(item.folha_mes),
                  anexoCalculado: item.anexo_calculado,
                  fatorR: item.fator_r,
                }))}
                monthlyInputsError={monthlyInputsError}
              />
            ) : (
              <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                Complete o onboarding para ativar o monitor mensal com histórico e alerta de anexo.
              </p>
            )}
          </Panel>

          <Panel style={{ padding: 24 }}>
            <Pill color="var(--blue)">Calendário fiscal</Pill>
            <h2 style={{ fontSize: 22, margin: '12px 0 18px' }}>Próximos toques do sistema</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {calendarItems.map(item => (
                <article key={item.title} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                    <strong style={{ fontSize: 14 }}>{item.title}</strong>
                    <Pill color={item.channel === 'email' ? 'var(--lime)' : 'var(--blue)'}>
                      {item.channel}
                    </Pill>
                  </div>
                  <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                    {item.body}
                  </p>
                </article>
              ))}
            </div>

            {latest?.fatorR && (
              <div style={{ marginTop: 18 }}>
                <Pill color="var(--yellow)">Pró-labore interativo</Pill>
                <div style={{ marginTop: 12 }}>
                  <FatorRInterativo
                    projecao={latest.alertaTeto.projecaoAnual}
                    fatorRInicial={latest.fatorR.fatorR}
                  />
                </div>
              </div>
            )}
          </Panel>
        </section>

        <section style={{ marginBottom: 16 }}>
          <Panel className="surface-hover" style={{
            padding: 28,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 18,
            alignItems: 'center',
            borderColor: 'rgba(200,241,53,0.24)',
          }}>
            <div>
              <Pill color="var(--lime)">Relatório premium</Pill>
              <h2 style={{ fontSize: 24, margin: '14px 0 8px' }}>PDF fiscal pronto para enviar ao contador</h2>
              <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7, margin: 0, maxWidth: 760 }}>
                Converta o cenário mais recente em memória de cálculo, comparativo de regimes e evidências de teto em um arquivo compartilhável.
              </p>
            </div>
            <Link
              href="/relatorio"
              className="dashboard-action dashboard-primary-action"
              style={{ padding: '13px 18px', fontSize: 14, fontWeight: 850, whiteSpace: 'nowrap' }}
            >
              Gerar relatório
            </Link>
          </Panel>
        </section>

        <section className="dashboard-main-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}>
          <Panel style={{ padding: 22 }}>
            <Pill color={PLAN_ACCENT_COLORS[currentPlan]}>Conta</Pill>
            <h2 style={{ fontSize: 20, margin: '14px 0 8px' }}>{PLAN_LABELS[currentPlan]}</h2>
            <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
              {PLAN_DESCRIPTIONS[currentPlan]}
            </p>
          </Panel>

          <Panel style={{ padding: 22 }}>
            <Pill color="var(--red)">Zona sensível</Pill>
            <h2 style={{ fontSize: 20, margin: '14px 0 8px' }}>Excluir conta</h2>
            <DeleteAccountSection />
          </Panel>
        </section>
      </div>
    </main>
  )
}
