import type { Metadata } from 'next'
import Link from 'next/link'
import { StaticPageLayout } from '@/components/layout/StaticPageLayout'
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'

const ARTICLE_PATH = '/aprenda/diferenca-anexo-iii-e-v'
const ARTICLE_TITLE = 'Anexo III ou Anexo V em 2026: Fator R e imposto menor'
const ARTICLE_DESCRIPTION = 'Entenda a diferença entre Anexo III e Anexo V, quando o Fator R muda a tributação e por que a alíquota inicial pode ir de 6% para 15,5%.'

export const metadata: Metadata = {
  title: ARTICLE_TITLE,
  description: ARTICLE_DESCRIPTION,
  alternates: { canonical: ARTICLE_PATH },
  openGraph: {
    title: ARTICLE_TITLE,
    description: ARTICLE_DESCRIPTION,
    url: ARTICLE_PATH,
  },
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text1)', marginTop: 40, marginBottom: 12, lineHeight: 1.2 }}>
    {children}
  </h2>
)

const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ marginBottom: 16 }}>{children}</p>
)

const Strong = ({ children }: { children: React.ReactNode }) => (
  <strong style={{ color: 'var(--text1)', fontWeight: 700 }}>{children}</strong>
)

export default function DiferencaAnexoIiiEVPage() {
  return (
    <StaticPageLayout
      title="Anexo III vs Anexo V do Simples Nacional"
      subtitle="Para muitas empresas de serviços, a diferença entre os anexos depende do Fator R. A consequência prática é pagar bem menos ou bem mais imposto sobre a mesma receita."
    >
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span>Simples Nacional · Tributário</span>
        <span>·</span>
        <span>Atualizado para 2026</span>
        <span>·</span>
        <span>4 min de leitura</span>
      </div>

      <H2>Resumo direto</H2>
      <P>
        O <Strong>Anexo III</Strong> começa com alíquota nominal de 6%. O <Strong>Anexo V</Strong>
        começa em 15,5%. Para atividades de serviços sujeitas ao Fator R, a empresa usa o Anexo III
        quando a folha dos últimos 12 meses representa pelo menos 28% da receita bruta dos últimos
        12 meses. Abaixo disso, usa o Anexo V.
      </P>

      <Link href="/#simulador" style={{ color: 'var(--lime)', fontWeight: 800 }}>
        Comparar anexos com meus números →
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          {
            title: 'Anexo III',
            rate: '6%',
            desc: 'Mais comum para serviços com folha relevante. Pode ser alcançado por Fator R ≥ 28%.',
            color: 'var(--lime)',
          },
          {
            title: 'Anexo V',
            rate: '15,5%',
            desc: 'Usado por serviços com Fator R abaixo de 28% quando a atividade está sujeita à regra.',
            color: 'var(--orange)',
          },
        ].map(item => (
          <div
            key={item.title}
            style={{
              background: 'var(--bg1)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '16px 18px',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>{item.title}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 900, color: item.color }}>{item.rate}</div>
            <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginTop: 8 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      <H2>O que entra no Fator R</H2>
      <P>
        A fórmula compara <Strong>folha de salários dos últimos 12 meses</Strong> com
        <Strong> receita bruta dos últimos 12 meses</Strong>. Pró-labore, salários e encargos
        entram na conta. Distribuição de lucros não entra como folha.
      </P>

      <H2>Por que a decisão não é só aumentar pró-labore</H2>
      <P>
        Aumentar o pró-labore pode levar a empresa para o Anexo III, mas também aumenta INSS e
        pode impactar imposto de renda da pessoa física. O ponto correto é o menor pró-labore que
        melhora o regime sem criar custo maior em outra ponta.
      </P>

      <H2>Quando a comparação importa mais</H2>
      <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
        <li style={{ marginBottom: 10 }}>Serviços de tecnologia, consultoria, engenharia, arquitetura, saúde e design.</li>
        <li style={{ marginBottom: 10 }}>Empresas que estão saindo do MEI e projetam faturamento acima de R$ 81.000.</li>
        <li style={{ marginBottom: 10 }}>Negócios com pouca folha e muito faturamento concentrado no sócio.</li>
        <li style={{ marginBottom: 10 }}>Empresas que podem contratar ou ajustar pró-labore sem perder margem.</li>
      </ul>

      <H2>Exemplo simples</H2>
      <P>
        Uma empresa de serviços faturou R$ 180.000 em 12 meses. Se tiver folha de R$ 36.000,
        seu Fator R é 20% e ela tende ao Anexo V. Se tiver folha de R$ 54.000, o Fator R sobe
        para 30% e pode levá-la ao Anexo III.
      </P>

      <div style={{
        background: 'var(--bg1)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '24px 28px',
        marginTop: 40,
      }}>
        <p style={{ fontWeight: 700, color: 'var(--text1)', marginBottom: 8 }}>
          Compare os anexos com seus números
        </p>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          O SimulaMEI mostra o anexo provável, a alíquota efetiva e o impacto do Fator R.
        </p>
        <Link
          href="/#simulador"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: 'var(--lime)', color: 'var(--ink-on-accent)',
            borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none',
          }}
        >
          Simular agora →
        </Link>
      </div>
      <ArticleJsonLd
        path={ARTICLE_PATH}
        headline={ARTICLE_TITLE}
        description={ARTICLE_DESCRIPTION}
      />
    </StaticPageLayout>
  )
}
