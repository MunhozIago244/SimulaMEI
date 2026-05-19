import Link from 'next/link'
import { StaticPageLayout } from '@/components/layout/StaticPageLayout'
import { TAX_RULE_VERSION, LIMITES_MEI, TOLERANCIA_EXCESSO } from '@/lib/tributario'
import { FONTES_FISCAIS } from '@/lib/tributario/oportunidades/fontes'
import { fmt, fmtPct } from '@/lib/format'

export const metadata = {
  title: 'Metodologia — SimulaMEI',
  description:
    'Como o SimulaMEI calcula: versão do motor tributário, fontes oficiais usadas, regras vigentes consideradas e os limites explícitos da estimativa.',
}

const versionLabel = TAX_RULE_VERSION.replace('BR-MEI-SN-', 'v')

function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text1)', margin: '32px 0 12px' }}>
      {children}
    </h2>
  )
}

export default function MetodologiaPage() {
  const fontes = Object.values(FONTES_FISCAIS)

  return (
    <StaticPageLayout
      title="Metodologia"
      subtitle="O cálculo mostra a fonte antes de pedir confiança. Esta página descreve o que entra na conta e o que fica de fora."
    >
      <H>Motor versionado</H>
      <p>
        Cada simulação roda sobre uma versão identificável do motor fiscal —
        atualmente <b style={{ fontFamily: 'var(--mono)', color: 'var(--text1)' }}>{TAX_RULE_VERSION}</b>{' '}
        (exibida como <b>Motor {versionLabel}</b> nos resultados). A versão permite
        que uma simulação salva seja reauditada depois com as mesmas regras.
      </p>

      <H>Fontes oficiais</H>
      <p>As tabelas, limites e regras vêm de bases públicas e verificáveis:</p>
      <ul style={{ margin: '10px 0', paddingLeft: 20 }}>
        {fontes.map(f => (
          <li key={f.fonteId} style={{ marginBottom: 8 }}>
            <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)' }}>
              {f.titulo}
            </a>
            {'observacao' in f && f.observacao ? (
              <span style={{ color: 'var(--text3)' }}> — {f.observacao}</span>
            ) : null}
          </li>
        ))}
      </ul>

      <H>Regras vigentes consideradas</H>
      <ul style={{ margin: '10px 0', paddingLeft: 20 }}>
        <li style={{ marginBottom: 6 }}>
          Teto MEI geral: <b style={{ color: 'var(--text1)' }}>{fmt(LIMITES_MEI.geral.anual)}/ano</b>.
        </li>
        <li style={{ marginBottom: 6 }}>
          Teto MEI caminhoneiro (transportador autônomo de cargas):{' '}
          <b style={{ color: 'var(--text1)' }}>{fmt(LIMITES_MEI.caminhoneiro.anual)}/ano</b>.
        </li>
        <li style={{ marginBottom: 6 }}>
          Tolerância de excesso: até <b style={{ color: 'var(--text1)' }}>{fmtPct(TOLERANCIA_EXCESSO)}</b>{' '}
          acima do teto gera efeitos a partir de 1º de janeiro do ano seguinte;
          acima disso, retroage ao início do ano do excesso.
        </li>
        <li>
          Propostas legislativas em tramitação (ex.: aumento do teto) aparecem
          apenas como contexto e <b>não entram no cálculo</b> até virarem regra vigente.
        </li>
      </ul>

      <H>Limites explícitos da estimativa</H>
      <p>
        O SimulaMEI é uma ferramenta de <b>estimativa educacional</b>. Não substitui
        a análise de um contador habilitado pelo CRC e não cobre benefícios fiscais
        locais, regimes monofásicos, substituição tributária nem situações
        societárias complexas. Para CNAEs oficiais ainda sem curadoria tributária,
        apenas teto e projeção (que independem da atividade) são exibidos — Anexo e
        Fator R ficam indisponíveis para não apresentar estimativa não verificada
        como confiável.
      </p>
      <p style={{ marginTop: 16 }}>
        <Link href="/#simulador" style={{ color: 'var(--lime)', fontWeight: 700 }}>
          Voltar ao simulador →
        </Link>
      </p>
    </StaticPageLayout>
  )
}
