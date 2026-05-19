import type { Metadata } from 'next'
import Link from 'next/link'
import { StaticPageLayout } from '@/components/layout/StaticPageLayout'
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'
import { ArticleMeta, Callout, H2, P, SimulatorCTA, Strong } from '@/components/article/Body'

const ARTICLE_PATH = '/aprenda/limite-mei-2026'
const ARTICLE_TITLE = 'Limite do MEI em 2026: quanto você pode faturar'
const ARTICLE_DESCRIPTION =
  'O teto do MEI em 2026: limite anual comum e do caminhoneiro, limite proporcional no ano de abertura, tolerância de 20% e por que a projeção importa mais que o acumulado.'

export const metadata: Metadata = {
  title: ARTICLE_TITLE,
  description: ARTICLE_DESCRIPTION,
  alternates: { canonical: ARTICLE_PATH },
  openGraph: { title: ARTICLE_TITLE, description: ARTICLE_DESCRIPTION, url: ARTICLE_PATH },
}

export default function LimiteMei2026Page() {
  return (
    <StaticPageLayout
      title="Qual é o limite do MEI em 2026?"
      subtitle="O teto não é só o número do fim do ano: é a projeção. Saber a diferença evita descobrir o estouro tarde demais."
    >
      <ArticleMeta tag="MEI · Teto 2026" readingTime="4 min" />

      <H2>O teto vigente</H2>
      <P>
        O limite anual do MEI comum é de <Strong>R$ 81.000</Strong>. Para o MEI
        caminhoneiro (transportador autônomo de cargas), o limite é de{' '}
        <Strong>R$ 251.600</Strong>. Se o CNPJ foi aberto durante o ano, o teto é
        proporcional aos meses de atividade.
      </P>
      <Callout>
        Acumulado não é projeção. R$ 67.500 faturados até outubro parecem dentro do
        teto, mas projetam R$ 81.000 no ano — exatamente no limite.
      </Callout>

      <Link href="/#simulador" style={{ color: 'var(--lime)', fontWeight: 800 }}>
        Ver minha projeção anual agora →
      </Link>

      <H2>A tolerância de 20%</H2>
      <P>
        Estourar o teto não significa, automaticamente, retroatividade. Até{' '}
        <Strong>20% acima do limite</Strong> (R$ 97.200 para o MEI comum), o
        desenquadramento costuma produzir efeitos a partir de 1º de janeiro do ano
        seguinte. Acima de 20%, o risco passa a ser retroativo ao início do ano do
        excesso.
      </P>

      <H2>Propostas de aumento do teto</H2>
      <P>
        Existem projetos de lei em tramitação propondo elevar o limite do MEI. Como
        ainda <Strong>não são regra vigente</Strong>, não entram no cálculo: o
        SimulaMEI usa o teto em vigor e trata propostas apenas como contexto.
      </P>
      <Callout color="orange">
        Decisões fiscais com base em projeto de lei são arriscadas — planeje pelo
        teto que vale hoje e confirme com um contador.
      </Callout>

      <H2>Já estourei. E agora?</H2>
      <P>
        Se a projeção passou do limite, veja o guia{' '}
        <Link href="/aprenda/mei-estourou-o-teto" style={{ color: 'var(--lime)', fontWeight: 700 }}>
          MEI estourou o teto: o que fazer
        </Link>{' '}
        e simule os regimes antes de pedir o desenquadramento.
      </P>

      <SimulatorCTA
        title="Quanto você ainda pode faturar este ano?"
        description="O SimulaMEI projeta seu faturamento anual e mostra a folga (ou o estouro) em menos de 1 minuto."
      />

      <ArticleJsonLd path={ARTICLE_PATH} headline={ARTICLE_TITLE} description={ARTICLE_DESCRIPTION} />
    </StaticPageLayout>
  )
}
