import { describe, expect, it } from 'vitest'
import { makeNormalizer } from '@core/normalize'
describe('makeNormalizer', () => {
  it('maps the observed minimum and maximum to 0 and 1', () => {
    const normalize = makeNormalizer([10, 20, 30])

    expect(normalize(10)).toBe(0)
    expect(normalize(20)).toBe(0.5)
    expect(normalize(30)).toBe(1)
  })

  it('maps a constant series to 0.5 instead of dividing by zero', () => {
    const normalize = makeNormalizer([7, 7, 7])

    expect(normalize(7)).toBe(0.5)
  })

  it('clamps values outside the observed range', () => {
    const normalize = makeNormalizer([10, 20, 30])

    expect(normalize(0)).toBe(0)
    expect(normalize(40)).toBe(1)
  })

  it('rejects an empty series', () => {
    expect(() => makeNormalizer([])).toThrow(/empty/)
  })

  it('rejects non-finite values in the series', () => {
    expect(() => makeNormalizer([1, Number.NaN, 3])).toThrow(/non-finite/)
  })

  it('rejects a non-finite value at call time', () => {
    const normalize = makeNormalizer([0, 1])

    expect(() => normalize(Number.NaN)).toThrow(/non-finite/)
  })
})
