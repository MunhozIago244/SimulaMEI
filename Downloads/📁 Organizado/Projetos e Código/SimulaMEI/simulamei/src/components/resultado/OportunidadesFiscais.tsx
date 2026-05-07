'use client'

import type { OportunidadeFiscal } from '@/lib/tributario'
import { fmt } from '@/lib/format'
import { Badge } from '@/components/ui'

interface OportunidadesFiscaisProps {
  oportunidades: OportunidadeFiscal[]
}

const PRIORIDADE_COLOR: Record<OportunidadeFiscal['prioridade'], string> = {
  alta: 'var(--lime)',
  media: 'var(--yellow)',
  baixa: 'var(--blue)',
}

const RISCO_LABEL: Record<OportunidadeFiscal['risco'], string> = {
  baixo: 'risco baixo',
  medio: 'risco médio',
  alto: 'risco alto',
  critico: 'risco crítico',
}

export function OportunidadesFiscais({ oportunidades }: OportunidadesFiscaisProps) {
  if (oportunidades.length === 0) {
    return (
      <section style={{
        background: 'var(--bg1)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '28px 32px', marginBottom: 28,
      }}>
        <Badge color="var(--blue)">Diagnóstico fiscal</Badge>
        <h3 style={{ fontSize: 20, fontWeight: 800, margin: '12px 0 6px' }}>
          Nenhuma oportunidade relevante encontrada
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
          O cenário atual não gerou alerta relevante no motor. Continue monitorando faturamento, folha e mudanças oficiais.
        </p>
      </section>
    )
  }

  const impactoTotal = oportunidades.reduce((sum, item) => sum + item.impactoEstimadoAnual, 0)

  return (
    <section style={{
      background: 'var(--bg1)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '30px 34px', marginBottom: 28,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start', marginBottom: 24 }}>
        <div>
          <Badge color="var(--lime)">Motor de oportunidades</Badge>
          <h3 style={{ fontSize: 22, fontWeight: 800, margin: '12px 0 6px' }}>
            Oportunidades fiscais encontradas
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            Estimativas para triagem. Valide a execução com contador antes de alterar regime, folha ou enquadramento.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Impacto estimado</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 26, color: 'var(--lime)', fontWeight: 800 }}>
            {impactoTotal > 0 ? `${fmt(impactoTotal)}/ano` : 'Risco'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {oportunidades.map(oportunidade => (
          <article
            key={oportunidade.id}
            style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <Badge color={PRIORIDADE_COLOR[oportunidade.prioridade]}>
                {oportunidade.prioridade.toUpperCase()}
              </Badge>
              <Badge color="var(--blue)">{oportunidade.confianca}</Badge>
              <Badge color={oportunidade.risco === 'critico' ? 'var(--red)' : 'var(--text3)'}>
                {RISCO_LABEL[oportunidade.risco]}
              </Badge>
              <Badge color="var(--text3)">{oportunidade.regraVersao}</Badge>
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>
              {oportunidade.titulo}
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 14 }}>
              {oportunidade.resumo}
            </p>
            {oportunidade.impactoEstimadoAnual > 0 && (
              <div style={{ fontFamily: 'var(--mono)', color: 'var(--lime)', fontWeight: 800, marginBottom: 12 }}>
                {fmt(oportunidade.impactoEstimadoAnual)} por ano de impacto estimado
              </div>
            )}
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text2)', fontSize: 13, lineHeight: 1.7 }}>
              {oportunidade.acoes.map(acao => (
                <li key={acao}>{acao}</li>
              ))}
            </ul>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {oportunidade.evidencias.map(evidencia => (
                <a
                  key={`${oportunidade.id}-${evidencia.fonteId}`}
                  href={evidencia.url.startsWith('internal:') ? undefined : evidencia.url}
                  style={{
                    fontSize: 11,
                    color: 'var(--text3)',
                    textDecoration: 'none',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '5px 7px',
                    cursor: evidencia.url.startsWith('internal:') ? 'default' : 'pointer',
                  }}
                >
                  {evidencia.tipo}: {evidencia.titulo}
                </a>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
