import { TAX_RULE_VERSION } from '@/lib/tributario'

const ITEMS = [
  {
    title: 'Motor tributário versionado',
    desc: `Os cálculos seguem a legislação vigente em 2026 (LC 123/2006, Resolução CGSN 94/2011 e atualizações). Cada versão do motor é versionada e auditável.`,
    icon: '⚙',
    color: 'var(--blue)',
  },
  {
    title: 'Fontes oficiais',
    desc: 'Tabelas do Simples Nacional (Receita Federal), limites MEI (Resolução CGMEI), alíquotas LP/LR (RIR/99 e CSLL), dados do portal gov.br.',
    icon: '📎',
    color: 'var(--lime)',
  },
  {
    title: 'Regras vigentes vs. tramitação',
    desc: 'A simulação usa apenas regras já em vigor. Projetos em tramitação (PLP 60/2025, PLP 67/2025 — novos tetos MEI) são sinalizados como "em análise" e não afetam os cálculos.',
    icon: '⚖',
    color: 'var(--yellow)',
  },
  {
    title: 'Limitações da simulação',
    desc: 'Não considera benefícios fiscais específicos por município, regimes monofásicos, substituição tributária, operações com exterior e situações societárias complexas.',
    icon: '!',
    color: 'var(--orange)',
  },
]

export function HowWeCalculate() {
  return (
    <section id="como-calcula" style={{ padding: '80px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ maxWidth: 600, marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 28, height: 2, background: 'var(--blue)' }} />
            <span style={{
              fontSize: 11, fontWeight: 700, color: 'var(--blue)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              Transparência
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 12 }}>
            Como calculamos
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6 }}>
            Toda simulação é baseada em regras públicas, verificáveis e atualizadas.{' '}
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)' }}>
              {TAX_RULE_VERSION}
            </span>
          </p>
        </div>

        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 40 }}
          className="how-grid"
        >
          {ITEMS.map((item, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg1)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '24px 28px',
                display: 'flex', gap: 18, alignItems: 'flex-start',
              }}
            >
              <div style={{
                width: 40, height: 40, background: item.color + '18',
                color: item.color, borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{item.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 'var(--radius-lg)', padding: '20px 24px',
          display: 'flex', gap: 16, alignItems: 'flex-start',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
            <b style={{ color: 'var(--text1)' }}>Disclaimer fiscal:</b> O SimulaMEI é uma ferramenta de
            estimativa educacional. Os resultados não constituem consultoria ou assessoria tributária.
            A decisão de alterar regime fiscal deve ser tomada com orientação de contador habilitado pelo CRC.
            Alíquotas e limites podem ser alterados por legislação superveniente.
          </div>
        </div>
      </div>

    </section>
  )
}
