export type Normalizer = (value: number) => number

/**
 * Builds a min-max normalizer that maps the observed range of `values`
 * onto [0, 1]. Values outside the observed range are clamped.
 *
 * A constant series has no meaningful range, so it maps to 0.5 - that keeps
 * the output musical instead of producing NaN or a division by zero.
 */
export function makeNormalizer(values: readonly number[]): Normalizer {
  if (values.length === 0) {
    throw new Error('Cannot normalize an empty data series')
  }
  if (!values.every((value) => Number.isFinite(value))) {
    throw new Error('Cannot normalize a series that contains non-finite values')
  }

  let min = Infinity
  let max = -Infinity
  for (const value of values) {
    if (value < min) min = value
    if (value > max) max = value
  }

  const span = max - min

  return (value: number): number => {
    if (!Number.isFinite(value)) {
      throw new Error(`Cannot normalize a non-finite value: ${value}`)
    }
    if (span === 0) return 0.5
    return clamp01((value - min) / span)
  }
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * clamp01(t)
}
