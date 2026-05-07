import { describe, expect, it } from 'vitest'
import { normalizeOfficeClientCreate } from './clients'

describe('normalizeOfficeClientCreate', () => {
  it('normalizes a valid client payload', () => {
    const result = normalizeOfficeClientCreate({
      nome: '  Loja Modelo  ',
      email: 'CLIENTE@EXEMPLO.COM ',
      cnae: '4712100',
      tipoMei: 'geral',
      uf: 'sp',
      municipio: ' Sao Paulo ',
      observacoes: ' Cliente com faturamento sazonal ',
    })

    expect(result).toEqual({
      ok: true,
      value: {
        nome: 'Loja Modelo',
        email: 'cliente@exemplo.com',
        cnae: '4712-1/00',
        tipoMei: 'geral',
        uf: 'SP',
        municipio: 'Sao Paulo',
        observacoes: 'Cliente com faturamento sazonal',
      },
    })
  })

  it('rejects an unknown CNAE', () => {
    const result = normalizeOfficeClientCreate({
      nome: 'Cliente',
      cnae: '9999999',
      tipoMei: 'geral',
    })

    expect(result).toEqual({ ok: false, error: 'Informe um CNAE oficial válido.' })
  })

  it('rejects invalid UF', () => {
    const result = normalizeOfficeClientCreate({
      nome: 'Cliente',
      cnae: '4712-1/00',
      tipoMei: 'geral',
      uf: 'XX',
    })

    expect(result).toEqual({ ok: false, error: 'UF inválida.' })
  })
})
