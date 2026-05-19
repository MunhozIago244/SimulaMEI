import type { Metadata } from 'next'
import Link from 'next/link'
import { StaticPageLayout } from '@/components/layout/StaticPageLayout'
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd'
import { ArticleMeta, Callout, H2, P, SimulatorCTA, Strong } from '@/components/article/Body'

const ARTICLE_PATH = '/aprenda/mei-estourou-o-teto'
const ARTICLE_TITLE = 'MEI estourou o teto: o que fazer agora'
const ARTICLE_DESCRIPTION =
  'Estourou o limite do MEI? Entenda os dois cenários (até 20% e acima de 20%), o risco de tributação retroativa e os passos para migrar sem pagar multa evitável.'

export const metadata: Metadata = {
  title: ARTICLE_TITLE,
  description: ARTICLE_DESCRIPTION,
  alternates: { canonical: ARTICLE_PATH },
  openGraph: { title: ARTICLE_TITLE, description: ARTICLE_DESCRIPTION, url: ARTICLE_PATH },
}

export default function MeiEstourouOTetoPage() {
  return (
    <StaticPageLayout
      title="Estourei o teto do MEI. E agora?"
      subtitle="Não entre em pânico — mas não ignore. O custo de agir errado aqui é imposto retroativo e multa."
    >
      <ArticleMeta tag="MEI · Desenquadramento" readingTime="5 min" />

      <H2>Primeiro: confirme o cenário</H2>
      <P>
        O que define a gravidade não é ter passado do teto, e sim <Strong>quanto</Strong>.
        Para o MEI comum, o limite é R$ 81.000 e a faixa de tolerância vai até{' '}
        <Strong>R$ 97.200</Strong> (20% acima).
      </P>

      <Link href="/#simulador" style={{ color: 'var(--lime)', fontWeight: 800 }}>
        Calcular meu excesso agora →
      </Link>

      <H2>Cenário 1 — excesso de até 20%</H2>
      <P>
        O desenquadramento costuma produzir efeitos a partir de{' '}
        <Strong>1º de janeiro do ano seguinte</Strong>. Ainda assim, é preciso
        comunicar o desenquadramento e recolher o DAS sobre o valor que excedeu o
        teto, normalmente na declaração anual.
      </P>

      <H2>Cenário 2 — excesso acima de 20%</H2>
      <P>
        Aqui o desenquadramento pode ser{' '}
        <Strong>retroativo a 1º de janeiro do ano em que o excesso ocorreu</Strong>.
        Se aconteceu no ano de abertura do CNPJ, a retroatividade pode ir até a data
        de abertura — você passa a apurar como ME/EPP no Simples Nacional desde lá.
      </P>
      <Callout color="orange">
        Este é o cenário que mais exige contador: a apuração retroativa muda o
        imposto devido de todo o período.
      </Callout>

      <H2>Os próximos passos</H2>
      <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
        <li style={{ marginBottom: 10 }}>Simule Simples Nacional, Lucro Presumido e Lucro Real para o faturamento real.</li>
        <li style={{ marginBottom: 10 }}>Para serviços, verifique o Fator R: Anexo III x V muda muito o custo.</li>
        <li style={{ marginBottom: 10 }}>Comunique o desenquadramento no prazo para evitar multa adicional.</li>
        <li style={{ marginBottom: 10 }}>Leve a simulação a um contador habilitado antes de decidir o regime.</li>
      </ul>
      <P>
        Veja também{' '}
        <Link href="/aprenda/quando-sair-do-mei" style={{ color: 'var(--lime)', fontWeight: 700 }}>
          quando sair do MEI
        </Link>{' '}
        e{' '}
        <Link href="/aprenda/limite-mei-2026" style={{ color: 'var(--lime)', fontWeight: 700 }}>
          o limite do MEI em 2026
        </Link>.
      </P>

      <SimulatorCTA
        title="Veja o tamanho do estouro e o regime mais barato"
        description="O SimulaMEI mostra o excesso, o cenário de risco e o comparativo de regimes para levar ao contador."
      />

      <ArticleJsonLd path={ARTICLE_PATH} headline={ARTICLE_TITLE} description={ARTICLE_DESCRIPTION} />
    </StaticPageLayout>
  )
}
