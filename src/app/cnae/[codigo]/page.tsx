import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCnaeDetalhe } from '@/lib/tributario/cnaeDetalhe'

interface PageProps {
  params: Promise<{ codigo: string }>
  searchParams: Promise<{ back?: string }>
}

const BACK_LABEL: Record<string, string> = {
  '/#simulador': '← Voltar ao simulador',
  '/onboarding': '← Voltar ao cadastro',
  '/contador/clientes/novo': '← Voltar ao novo cliente',
}

function backLabel(back: string): string {
  return BACK_LABEL[back] ?? '← Voltar'
}

export default async function CnaePage({ params, searchParams }: PageProps) {
  const { codigo } = await params
  const { back } = await searchParams
  const detalhe = getCnaeDetalhe(decodeURIComponent(codigo))
  if (!detalhe) notFound()

  const curado = detalhe.classificacaoTributaria === 'curada'
  const backHref = back ?? '/#simulador'

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg0)', color: 'var(--text1)', padding: '48px 24px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <Link href={backHref} style={{ color: 'var(--lime)', fontSize: 13, textDecoration: 'none' }}>
          {backLabel(backHref)}
        </Link>

        <section style={{ marginTop: 28, marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--mono)', color: 'var(--text3)', fontSize: 13 }}>{detalhe.cnae}</div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 64px)', lineHeight: 1, margin: '10px 0 16px' }}>
            {detalhe.descricao}
          </h1>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: curado ? 'var(--lime)' : 'var(--yellow)' }}>
              {curado ? 'Tributação curada' : 'Curadoria tributária pendente'}
            </span>
            <span style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text2)' }}>
              Fonte oficial IBGE/CONCLA
            </span>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 28 }}>
          {Object.entries(detalhe.hierarquia).map(([label, value]) => (
            <div key={label} style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 800 }}>{value}</div>
            </div>
          ))}
        </section>

        <section style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 10 }}>Status fiscal</h2>
          {curado && detalhe.perfilTributario ? (
            <p style={{ color: 'var(--text2)', lineHeight: 1.7 }}>
              Este CNAE possui curadoria no SimulaMEI. Anexo padrão: <b>Anexo {detalhe.perfilTributario.anexoPadrao}</b>.
              {detalhe.perfilTributario.elegivelFatorR ? ' Elegível ao Fator R.' : ' Fator R não marcado para este perfil.'}
            </p>
          ) : (
            <p style={{ color: 'var(--text2)', lineHeight: 1.7 }}>
              Este CNAE existe na base oficial, mas ainda não possui classificação tributária validada no SimulaMEI.
              A simulação completa fica bloqueada até haver curadoria de Anexo, MEI e Fator R.
            </p>
          )}
          <div style={{ marginTop: 18, fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
            Fonte: <a href={detalhe.fonte.url} style={{ color: 'var(--lime)' }}>{detalhe.fonte.nome}</a><br />
            Hash: <span style={{ fontFamily: 'var(--mono)' }}>{detalhe.fonte.hashSha256.slice(0, 16)}...</span>
          </div>
        </section>

        <div style={{ marginTop: 20 }}>
          <Link
            href={backHref}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 18px',
              background: 'var(--bg2)', border: '1px solid var(--border2)',
              borderRadius: 'var(--radius)', color: 'var(--text1)',
              fontSize: 13, fontWeight: 500, textDecoration: 'none',
            }}
          >
            {backLabel(backHref)}
          </Link>
        </div>

        <section className="cnae-accountant-cta" style={{
          marginTop: 18,
          border: '1px solid rgba(255,122,26,0.28)',
          background: 'rgba(255,122,26,0.06)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 18,
          alignItems: 'center',
        }}>
          <div>
            <div style={{ color: 'var(--orange)', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>
              Para escritórios contábeis
            </div>
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>
              Gerencia MEIs com este CNAE?
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>
              O plano contador foi desenhado para monitorar carteira, alertas de teto, Fator R e relatórios por cliente.
            </p>
          </div>
          <Link
            href="/para-contadores"
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              background: 'var(--orange)',
              color: 'var(--text-on-strong)',
              fontSize: 13,
              fontWeight: 900,
              whiteSpace: 'nowrap',
            }}
          >
            Ver plano contador
          </Link>
        </section>
      </div>
    </main>
  )
}
