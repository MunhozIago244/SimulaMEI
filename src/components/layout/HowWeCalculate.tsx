import { TAX_RULE_VERSION } from '@/lib/tributario'

const ITEMS = [
  {
    title: 'Motor tributário versionado',
    desc: 'Cada cálculo roda sobre uma versão identificável do motor fiscal, para que uma simulação possa ser revisada depois.',
    color: 'var(--blue)',
  },
  {
    title: 'Fontes públicas e verificáveis',
    desc: 'Limites MEI, tabelas do Simples Nacional, regras de Fator R e hipóteses de regimes vêm de bases oficiais.',
    color: 'var(--lime)',
  },
  {
    title: 'Regra vigente separada de projeto de lei',
    desc: 'Mudanças em tramitação aparecem como contexto, mas não entram no cálculo até virarem regra aplicável.',
    color: 'var(--yellow)',
  },
  {
    title: 'Limites explícitos da estimativa',
    desc: 'A ferramenta não substitui análise de contador, nem cobre benefícios locais, monofásicos ou situações societárias complexas.',
    color: 'var(--orange)',
  },
]

export function HowWeCalculate() {
  const versionLabel = TAX_RULE_VERSION.replace('BR-MEI-SN-', 'v')

  return (
    <section id="como-calcula" style={{ padding: '96px 0', borderTop: '1px solid var(--border)' }}>
      <div className="section-shell">
        <div className="im-section-header">
          <span className="im-section-number" data-reveal>02 / Método</span>
          <div data-reveal style={{ '--reveal-delay': '80' } as React.CSSProperties}>
            <h2 className="im-section-title">O cálculo mostra a fonte antes de pedir confiança.</h2>
            <p className="im-section-lead">
              A saída não é uma opinião solta. Ela combina teto, projeção anual, CNAE, Fator R e regime provável em uma leitura auditável.
            </p>
          </div>
        </div>

        <div
          className="instrument-panel"
          data-reveal
          style={{ '--reveal-delay': '160', display: 'grid', gridTemplateColumns: 'minmax(260px, 0.82fr) minmax(0, 1.18fr)' } as React.CSSProperties}
        >
          <div style={{
            padding: '28px 30px',
            borderRight: '1px solid var(--border)',
            display: 'grid',
            alignContent: 'space-between',
            gap: 30,
            minHeight: 390,
          }}>
            <div>
              <span className="instrument-label">Versão do motor</span>
              <div style={{ fontFamily: 'var(--mono)', color: 'var(--lime)', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 950, lineHeight: 1, marginTop: 12 }}>
                {versionLabel}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7 }}>
                Cada resultado traz o cenário fiscal e a ressalva necessária para conversar com um contador sem transformar estimativa em promessa.
              </div>
              <div className="evidence-strip">
                <span className="evidence-pill">Teto MEI</span>
                <span className="evidence-pill">Fator R</span>
                <span className="evidence-pill">Anexos</span>
              </div>
            </div>
          </div>

          <ol style={{ listStyle: 'none', display: 'grid' }}>
            {ITEMS.map((item, index) => (
              <li
                key={item.title}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '62px minmax(0, 1fr)',
                  gap: 18,
                  padding: '24px 28px',
                  borderBottom: index === ITEMS.length - 1 ? 'none' : '1px solid var(--border)',
                }}
              >
                <span style={{
                  color: item.color,
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  fontWeight: 950,
                  letterSpacing: '0.06em',
                }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 style={{ color: 'var(--text1)', fontSize: 16, fontWeight: 850, marginBottom: 7 }}>
                    {item.title}
                  </h3>
                  <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7, maxWidth: 640 }}>
                    {item.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div
          data-reveal
          style={{
            '--reveal-delay': '240',
            marginTop: 18,
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '16px 18px',
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
          } as React.CSSProperties}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text1)' }}>Disclaimer fiscal:</strong> o SimulaMEI é uma ferramenta de
            estimativa educacional. A decisão de alterar regime fiscal deve ser tomada com orientação de contador habilitado pelo CRC.
          </div>
        </div>
      </div>
    </section>
  )
}
