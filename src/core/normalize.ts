export type Normalizer = (value: number) => number

/**
 * function to create normalizer: used min-max algorithm.
 * if value is out of range -> it gets clamped to 0 or 1.
 * if series is constant, it maps to 0.5.
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

// linear interpolation -> converts a normalized data value (from [0, 1]) into a musical range.
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * clamp01(t)
}
