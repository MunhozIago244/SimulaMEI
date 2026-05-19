import { describe, expect, it } from 'vitest'
import { resultadoVisibilidade } from './CnaePendenteNotice'

describe('resultadoVisibilidade', () => {
  it('pendente: só teto/projeção — suprime tributação e gate, mostra notice', () => {
    expect(resultadoVisibilidade('pendente')).toEqual({
      mostrarTributacao: false,
      mostrarGate: false,
      mostrarNoticePendente: true,
    })
  })

  it('curada: mostra tributação e gate, sem notice', () => {
    expect(resultadoVisibilidade('curada')).toEqual({
      mostrarTributacao: true,
      mostrarGate: true,
      mostrarNoticePendente: false,
    })
  })

  it('undefined (curado padrão do motor): mostra tudo', () => {
    expect(resultadoVisibilidade(undefined)).toEqual({
      mostrarTributacao: true,
      mostrarGate: true,
      mostrarNoticePendente: false,
    })
  })
})
