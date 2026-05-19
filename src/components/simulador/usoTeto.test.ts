import { describe, expect, it } from 'vitest'
import { usoTetoPercent, barraTetoWidth } from './usoTeto'

describe('usoTetoPercent', () => {
  it('returns the TRUE percentage of the ceiling — not capped (regression: era travado em 130)', () => {
    // R$ 129.600 sobre teto R$ 81.000 = 160% (60% de excesso),
    // consistente com o "EXCESSO TETO 60,0%" exibido no mesmo card.
    expect(usoTetoPercent(129_600, 81_000)).toBeCloseTo(160)
  })

  it('computes a sub-ceiling usage normally', () => {
    expect(usoTetoPercent(40_500, 81_000)).toBeCloseTo(50)
  })

  it('is defensive against a non-positive ceiling', () => {
    expect(usoTetoPercent(1000, 0)).toBe(0)
  })
})

describe('barraTetoWidth', () => {
  it('caps the bar at 100% even when usage exceeds the ceiling', () => {
    expect(barraTetoWidth(160)).toBe(100)
  })

  it('passes a sub-100 value through and floors negatives at 0', () => {
    expect(barraTetoWidth(50)).toBe(50)
    expect(barraTetoWidth(-5)).toBe(0)
  })
})
