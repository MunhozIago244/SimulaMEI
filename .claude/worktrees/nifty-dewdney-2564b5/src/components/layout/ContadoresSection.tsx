'use client'

import { AccountantLeadForm } from '@/components/accountant/AccountantLeadForm'

const FEATURES = [
  'Relatório exportável em PDF com seus dados',
  'API disponível para integração com sistemas contábeis',
  'Motor de cálculo auditável e versionado',
  'Suporte a múltiplos CNAEs e regimes',
]

const PLANS_PREVIEW = [
  { name: 'Starter', price: 'R$ 97/mês', limit: 'Até 30 clientes' },
  { name: 'Pro', price: 'R$ 247/mês', limit: 'Até 150 clientes', highlight: true },
  { name: 'Enterprise', price: 'Sob consulta', limit: 'Sem limite' },
]

export function ContadoresSection() {
  return (
    <section id="contadores" style={{ padding: '80px 0', background: 'var(--bg1)', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}
          className="cnt-grid"
        >
          {/* Left: pitch */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 28, height: 2, background: 'var(--orange)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Para contadores
              </span>
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>
              Economize tempo na<br />análise de clientes MEI.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 28 }}>
              Use o SimulaMEI para apresentar cenários tributários de forma visual e clara.
              Seus clientes chegam à reunião já entendendo o problema.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {FEATURES.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: 'var(--text2)' }}>
                  <span style={{ color: 'var(--orange)', fontWeight: 800 }}>→</span>
                  {item}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {PLANS_PREVIEW.map(plan => (
                <div
                  key={plan.name}
                  style={{
                    border: `1px solid ${plan.highlight ? 'var(--orange)' : 'var(--border)'}`,
                    background: plan.highlight ? 'rgba(255,140,0,0.06)' : 'var(--bg2)',
                    borderRadius: 'var(--radius)',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 13, color: plan.highlight ? 'var(--orange)' : 'var(--text1)', marginBottom: 4 }}>
                    {plan.name}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text1)', marginBottom: 2 }}>
                    {plan.price}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{plan.limit}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: formulário unificado */}
          <div style={{
            background: 'var(--bg2)', borderRadius: 'var(--radius-lg)',
            padding: '32px 36px', border: '1px solid var(--border)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Acesso para escritórios</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>
              Plano contador com clientes ilimitados e relatórios com sua marca.
            </p>
            <AccountantLeadForm source="home" />
          </div>
        </div>
      </div>
    </section>
  )
}
