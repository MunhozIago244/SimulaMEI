import type { Metadata } from 'next'
import Link from 'next/link'
import { StaticPageLayout } from '@/components/layout/StaticPageLayout'
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'

const ARTICLE_PATH = '/aprenda/fator-r'
const ARTICLE_TITLE = 'Fator R 2026: como calcular e pagar menos impostos'
const ARTICLE_DESCRIPTION = 'Entenda o Fator R do Simples Nacional: o que é, como calcular, qual a diferença entre Anexo III e V, e como aumentar seu Fator R para pagar menos imposto.'

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
const Callout = ({ children, color = 'var(--lime)' }: { children: React.ReactNode; color?: string }) => (
  <div style={{
    background: color === 'var(--lime)' ? 'rgba(200,241,53,0.06)' : 'rgba(255,140,0,0.06)',
    border: `1px solid ${color === 'var(--lime)' ? 'rgba(200,241,53,0.2)' : 'rgba(255,140,0,0.2)'}`,
    borderRadius: 8, padding: '16px 20px', marginBottom: 20, fontSize: 14,
  }}>
    {children}
  </div>
)

export default function FatorRPage() {
  return (
    <StaticPageLayout
      title="O que é o Fator R e como calcular"
      subtitle="O Fator R é o indicador que define se você paga menos (Anexo III) ou mais (Anexo V) imposto no Simples Nacional. A diferença pode chegar a R$ 20.000/ano."
    >
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 32, display: 'flex', gap: 12 }}>
        <span>Fator R · Simples Nacional</span>
        <span>·</span>
        <span>Atualizado para 2026</span>
        <span>·</span>
        <span>4 min de leitura</span>
      </div>

      <H2>O que é o Fator R?</H2>
      <P>
        O Fator R é um <Strong>índice calculado para empresas de serviços</Strong> optantes pelo Simples Nacional.
        Ele compara o quanto você pagou em folha de salários (incluindo seu pró-labore) com o seu faturamento bruto
        nos últimos 12 meses.
      </P>
      <P>
        A Receita Federal usa esse índice para decidir se sua empresa é tributada pelo{' '}
        <Strong>Anexo III</Strong> (mais barato, a partir de 6%) ou pelo{' '}
        <Strong>Anexo V</Strong> (mais caro, a partir de 15,5%).
      </P>

      <H2>Como calcular o Fator R</H2>
      <Callout>
        <strong style={{ display: 'block', marginBottom: 8 }}>Fórmula:</strong>
        Fator R = Folha de salários dos últimos 12 meses ÷ Faturamento bruto dos últimos 12 meses
      </Callout>
      <P>
        Se o resultado for <Strong>igual ou superior a 28%</Strong>, você é tributado pelo Anexo III.
        Se for abaixo de 28%, cai no Anexo V.
      </P>
      <P>
        <Strong>Exemplo prático:</Strong> você faturou R$ 180.000 nos últimos 12 meses e pagou
        R$ 57.600 em folha (incluindo seu pró-labore de R$ 4.800/mês). Fator R = 57.600 / 180.000 = 32%.
        Resultado: Anexo III.
      </P>

      <Link href="/#simulador" style={{ color: 'var(--lime)', fontWeight: 800 }}>
        Calcular meu Fator R com meus dados →
      </Link>

      <H2>A diferença de imposto entre Anexo III e V</H2>
      <P>
        Para um faturamento de R$ 180.000/ano:
      </P>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20,
      }}>
        {[
          { label: 'Anexo III (Fator R ≥ 28%)', aliq: '6,0%', imposto: 'R$ 10.800/ano', color: 'var(--lime)' },
          { label: 'Anexo V (Fator R < 28%)', aliq: '15,5%', imposto: 'R$ 27.900/ano', color: 'var(--orange)' },
        ].map(r => (
          <div key={r.label} style={{
            background: 'var(--bg1)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '16px 18px',
          }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>{r.label}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 900, color: r.color }}>{r.aliq}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{r.imposto}</div>
          </div>
        ))}
      </div>
      <P>
        A diferença neste exemplo é de <Strong>R$ 17.100 por ano</Strong> — só por causa do Fator R.
      </P>

      <H2>Como aumentar o Fator R</H2>
      <P>
        Como o Fator R depende da proporção entre folha e faturamento, há duas formas de aumentá-lo:
      </P>
      <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
        <li style={{ marginBottom: 10 }}>
          <Strong>Aumentar o pró-labore:</Strong> se você hoje retira R$ 1.500/mês (1 salário mínimo),
          aumentar para R$ 3.000 ou R$ 4.000 pode ser suficiente para atingir os 28%.
          O pró-labore também entra na conta da folha.
        </li>
        <li style={{ marginBottom: 10 }}>
          <Strong>Contratar funcionários:</Strong> a folha dos funcionários entra no cálculo.
          Se você já tem funcionários, lembre-se de incluí-los.
        </li>
      </ul>
      <Callout color="var(--orange)">
        <strong>Atenção:</strong> aumentar o pró-labore reduz o imposto pelo Simples, mas aumenta o INSS do sócio.
        Calcule o saldo líquido antes de tomar a decisão. O SimulaMEI mostra a economia real considerando o INSS.
      </Callout>

      <H2>O Fator R se aplica a todo CNAE?</H2>
      <P>
        Não. O Fator R é exclusivo para <Strong>atividades de serviços</Strong> enquadradas nos Anexos III e V
        do Simples Nacional. Comércio (Anexo I), indústria (Anexo II) e serviços fixos no Anexo IV
        não utilizam o Fator R.
      </P>
      <P>
        Na prática, os CNAEs mais comuns que usam o Fator R são: TI e desenvolvimento de software,
        consultoria, medicina, odontologia, advocacia, arquitetura e design.
      </P>

      <div style={{
        background: 'var(--bg1)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '24px 28px', marginTop: 40,
      }}>
        <p style={{ fontWeight: 700, color: 'var(--text1)', marginBottom: 8 }}>
          Calcule seu Fator R agora, gratuitamente
        </p>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          O SimulaMEI calcula o Fator R, mostra o regime ideal e estima a economia anual
          em menos de 1 minuto, sem cadastro.
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
