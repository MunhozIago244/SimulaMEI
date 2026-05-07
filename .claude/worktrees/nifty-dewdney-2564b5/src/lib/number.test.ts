import { describe, expect, it } from 'vitest'
import { parsePtBrNumber } from './number'

describe('parsePtBrNumber', () => {
  it('parses pt-BR currency-like values safely', () => {
    expect(parsePtBrNumber('1.234,56')).toBe(1234.56)
    expect(parsePtBrNumber('1.234.567')).toBe(1234567)
    expect(parsePtBrNumber('1234.56')).toBe(1234.56)
    expect(parsePtBrNumber('1.234')).toBe(1234)
  })
})
