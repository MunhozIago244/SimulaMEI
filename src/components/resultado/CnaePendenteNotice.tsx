import Link from 'next/link'

export type CnaeClassificacao = 'curada' | 'pendente' | undefined

export interface ResultadoVisibilidade {
  /** Anexo, alíquota, DAS, Fator R, Score — dependem de curadoria. */
  mostrarTributacao: boolean
  /** Gate de análise completa — o conteúdo gated também seria não curado. */
  mostrarGate: boolean
  mostrarNoticePendente: boolean
}

/**
 * Fronteira fiscal: para CNAE oficial sem curadoria, o motor cai em
 * fallback conservador (Anexo III). Exibir esse cálculo como confiável
 * num produto fiscal é pior que omitir — então só teto/projeção (exatos,
 * independem de curadoria) são mostrados.
 */
export function resultadoVisibilidade(c: CnaeClassificacao): ResultadoVisibilidade {
  const pendente = c === 'pendente'
  return {
    mostrarTributacao: !pendente,
    mostrarGate: !pendente,
    mostrarNoticePendente: pendente,
  }
}

/** Aviso exibido no lugar dos cards tributários quando o CNAE é pendente. */
export function CnaePendenteNotice({ cnae }: { cnae: string }) {
  return (
    <div
      className="fade-up-2"
      style={{
        background: 'oklch(82% 0.15 85 / 0.07)',
        border: '1px solid oklch(82% 0.15 85 / 0.22)',
        borderTop: '2px solid var(--yellow)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: 32,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--yellow)', fontWeight: 800, flexShrink: 0 }}>!</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>
            Anexo e Fator R indisponíveis para este CNAE
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>
            O teto e a projeção acima são <b>exatos</b> — não dependem da atividade.
            Mas este CNAE é oficial e ainda <b>não tem curadoria tributária</b>: o
            Anexo do Simples, a alíquota e o Fator R não são exibidos para não
            apresentar uma estimativa não verificada como se fosse confiável.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href={`/cnae/${cnae}`}
              className="pressable"
              style={{
                fontSize: 13, fontWeight: 700, color: 'var(--blue)',
                textDecoration: 'none',
              }}
            >
              Ver ficha oficial do CNAE →
            </Link>
            <a
              href={`mailto:?subject=${encodeURIComponent(`Avisar quando o CNAE ${cnae} tiver curadoria`)}`}
              className="pressable"
              style={{
                fontSize: 13, fontWeight: 700, color: 'var(--text2)',
                textDecoration: 'none',
              }}
            >
              Avisar quando estiver disponível
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
