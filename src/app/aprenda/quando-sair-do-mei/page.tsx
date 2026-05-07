import type { Metadata } from 'next'
import Link from 'next/link'
import { StaticPageLayout } from '@/components/layout/StaticPageLayout'
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'

const ARTICLE_PATH = '/aprenda/quando-sair-do-mei'
const ARTICLE_TITLE = 'Quando sair do MEI em 2026: teto, excesso e migração'
const ARTICLE_DESCRIPTION = 'Entenda quando o MEI precisa migrar para ME: limite de faturamento, excesso de 20%, contratação, sócios, filial e atividade não permitida.'

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

const Callout = ({ children, tone = 'lime' }: { children: React.ReactNode; tone?: 'lime' | 'orange' }) => (
  <div style={{
    background: tone === 'lime' ? 'rgba(200,241,53,0.06)' : 'rgba(255,140,0,0.06)',
    border: `1px solid ${tone === 'lime' ? 'rgba(200,241,53,0.2)' : 'rgba(255,140,0,0.2)'}`,
    borderRadius: 8,
    padding: '16px 20px',
    marginBottom: 20,
    fontSize: 14,
  }}>
    {children}
  </div>
)

export default function QuandoSairDoMeiPage() {
  return (
    <StaticPageLayout
      title="Quando devo sair do MEI?"
      subtitle="Sair do MEI não é fracasso. Normalmente é sinal de crescimento, mas precisa ser planejado para evitar imposto retroativo e multas."
    >
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span>MEI · Teto 2026</span>
        <span>·</span>
        <span>Atualizado para 2026</span>
        <span>·</span>
        <span>5 min de leitura</span>
      </div>

      <H2>O principal gatilho: faturamento</H2>
      <P>
        O limite anual do MEI comum é de <Strong>R$ 81.000</Strong>. Para MEI caminhoneiro,
        o limite é maior: <Strong>R$ 251.600</Strong>. Se a empresa abriu durante o ano,
        o limite é proporcional aos meses de atividade.
      </P>
      <Callout>
        Regra prática: acompanhe a projeção anual, não só o faturamento já emitido. Um MEI com
        R$ 67.500 acumulados em outubro parece dentro do teto, mas está projetando R$ 81.000 no ano.
      </Callout>

      <Link href="/#simulador" style={{ color: 'var(--lime)', fontWeight: 800 }}>
        Ver minha projeção anual agora →
      </Link>

      <H2>Se passar até 20% do limite</H2>
      <P>
        Quando o excesso não passa de 20%, o desenquadramento costuma produzir efeitos a partir de
        <Strong> 1º de janeiro do ano seguinte</Strong>. Ainda assim, você precisa comunicar o
        desenquadramento e pagar o DAS sobre o excesso na declaração anual.
      </P>
      <P>
        Para o MEI comum, 20% acima do teto equivale a <Strong>R$ 97.200</Strong>. Acima disso,
        o risco muda de patamar.
      </P>

      <H2>Se passar mais de 20% do limite</H2>
      <P>
        Quando a receita ultrapassa o limite em mais de 20%, o desenquadramento pode ser
        <Strong> retroativo a 1º de janeiro do ano em que ocorreu o excesso</Strong>. Se isso
        acontecer no ano de abertura do CNPJ, a retroatividade pode ir até a data de abertura.
      </P>
      <Callout tone="orange">
        Esse é o cenário que mais pede contador: a empresa passa a apurar tributos como ME ou EPP
        no Simples Nacional desde a data de efeito do desenquadramento.
      </Callout>

      <H2>Outros motivos para deixar de ser MEI</H2>
      <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
        <li style={{ marginBottom: 10 }}>Contratar mais de um empregado.</li>
        <li style={{ marginBottom: 10 }}>Ter sócio ou participar de outra empresa em situação vedada.</li>
        <li style={{ marginBottom: 10 }}>Abrir filial.</li>
        <li style={{ marginBottom: 10 }}>Incluir atividade econômica que não é permitida ao MEI.</li>
        <li style={{ marginBottom: 10 }}>Comprar insumos ou mercadorias acima do limite permitido em relação às vendas.</li>
      </ul>

      <H2>Como planejar a transição</H2>
      <P>
        Antes de pedir o desenquadramento, simule cenários no Simples Nacional, Lucro Presumido e
        Lucro Real. Para serviços sujeitos ao Fator R, a diferença entre Anexo III e Anexo V pode
        mudar completamente a decisão de pró-labore e contratação.
      </P>

      <div style={{
        background: 'var(--bg1)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '24px 28px',
        marginTop: 40,
      }}>
        <p style={{ fontWeight: 700, color: 'var(--text1)', marginBottom: 8 }}>
          Veja se você está perto do teto
        </p>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          O SimulaMEI calcula a projeção anual e mostra o risco de desenquadramento em menos de 1 minuto.
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
