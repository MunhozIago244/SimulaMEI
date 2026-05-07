import Link from 'next/link'
import { AccountantLeadForm } from '@/components/accountant/AccountantLeadForm'
import { TAX_RULE_VERSION } from '@/lib/tributario'
import { getSiteUrl } from '@/constants/site'

const PAGE_TITLE = 'SimulaMEI para Contadores — Painel de Carteira MEI'
const PAGE_DESCRIPTION = 'Monitore clientes MEI, alertas de teto e Fator R. Planos a partir de R$ 97/mês.'
const PAGE_URL = `${getSiteUrl()}/para-contadores`

export const metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    siteName: 'SimulaMEI',
    type: 'website' as const,
    locale: 'pt_BR',
    images: [
      {
        url: `${getSiteUrl()}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'SimulaMEI para Contadores',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [`${getSiteUrl()}/opengraph-image`],
  },
}

const VALUE_POINTS = [
  ['Carteira em risco', 'Veja quais clientes estão próximos do teto MEI antes da conversa virar urgência.'],
  ['Relatórios por cliente', 'Gere um material objetivo para justificar mudança de regime, pró-labore ou atenção ao CNAE.'],
  ['Alertas recorrentes', 'Use calendário fiscal, e-mail e histórico mensal para não depender de planilha manual.'],
  ['API no plano Pro', 'Integre simulação e alertas com rotinas internas do escritório quando a carteira crescer.'],
]

const PLAN_ROWS = [
  ['Starter', 'R$ 97/mês', 'Até 30 clientes', 'Dashboard, alertas e PDF por cliente'],
  ['Pro', 'R$ 247/mês', 'Até 150 clientes', 'API, CSV, histórico mensal e marca no PDF'],
  ['Enterprise', 'Sob consulta', 'Sem limite', 'Multi-seat, white-label completo, SLA e integrações'],
]

export default function ParaContadoresPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg0)', color: 'var(--text1)' }}>
      <header style={{
        padding: '20px 40px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24,
            height: 24,
            background: 'var(--lime)',
            borderRadius: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
            </svg>
          </div>
          <span style={{ fontWeight: 900 }}>Simula<span style={{ color: 'var(--lime)' }}>MEI</span></span>
        </Link>
        <Link href="/#simulador" style={{ color: 'var(--text2)', fontSize: 13 }}>
          Voltar ao simulador
        </Link>
      </header>

      <section style={{ padding: '58px 24px 44px' }}>
        <div
          className="accountant-hero-grid"
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.08fr) minmax(340px, 0.72fr)',
            gap: 30,
            alignItems: 'start',
          }}
        >
          <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
              <span style={{ width: 30, height: 2, background: 'var(--orange)' }} />
              <span style={{ color: 'var(--orange)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0 }}>
                Para escritórios contábeis
              </span>
            </div>
            <h1 style={{
              fontSize: 'clamp(34px, 6vw, 72px)',
              lineHeight: 0.96,
              letterSpacing: 0,
              maxWidth: 780,
              marginBottom: 18,
            }}>
              Monitore todos os seus MEIs antes do teto virar problema.
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 16, lineHeight: 1.7, maxWidth: 680, marginBottom: 28 }}>
              O plano contador transforma o motor fiscal do SimulaMEI em painel de carteira: clientes, alertas, Fator R, relatórios e API em um fluxo pensado para rotina contábil.
            </p>

            <div className="accountant-value-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 26 }}>
              {VALUE_POINTS.map(([title, body]) => (
                <div key={title} style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius)', padding: 18 }}>
                  <div style={{ color: 'var(--lime)', fontWeight: 900, marginBottom: 8 }}>{title}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.55 }}>{body}</div>
                </div>
              ))}
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                <thead>
                  <tr style={{ color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase' }}>
                    <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>Plano</th>
                    <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>Preço</th>
                    <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>Carteira</th>
                    <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>Uso principal</th>
                  </tr>
                </thead>
                <tbody>
                  {PLAN_ROWS.map(([plan, price, limit, value]) => (
                    <tr key={plan}>
                      <td style={{ padding: '12px 14px', fontWeight: 900, color: plan === 'Pro' ? 'var(--lime)' : 'var(--text1)' }}>{plan}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: plan === 'Pro' ? 'var(--lime)' : 'var(--text2)' }}>{price}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>{limit}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: 24, display: 'grid', gap: 20, alignContent: 'start' }}>
            <div style={{ color: 'var(--lime)', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>
              Acesso antecipado
            </div>
            <h2 style={{ fontSize: 24, lineHeight: 1.1, marginBottom: 10 }}>
              Entre na lista do painel contador
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              Use a faixa da carteira para receber uma abordagem compatível com o tamanho do escritório. Carteiras 150+ entram como prioridade comercial.
            </p>
            <AccountantLeadForm />

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>
                Já quer assinar?
              </div>
              <Link
                href="/upgrade/contador"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '13px 16px',
                  background: 'var(--lime)',
                  color: '#000',
                  borderRadius: 'var(--radius)',
                  fontWeight: 900,
                  fontSize: 14,
                  textDecoration: 'none',
                  gap: 10,
                }}
              >
                <span>Ver planos e preços</span>
                <span style={{ fontSize: 18 }}>→</span>
              </Link>
              <p style={{ color: 'var(--text3)', fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
                Starter R$ 97/mês · Pro R$ 247/mês · Enterprise sob consulta
              </p>
            </div>
          </aside>
        </div>
      </section>

      <footer style={{ padding: '24px 40px', borderTop: '1px solid var(--border)', color: 'var(--text3)', fontSize: 12 }}>
        Motor tributário {TAX_RULE_VERSION}. Estimativas para triagem, sempre com validação profissional habilitada.
      </footer>
    </main>
  )
}
