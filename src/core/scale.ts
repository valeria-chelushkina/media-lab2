import { clamp01 } from '@core/normalize'
// C major pentatonic: C, D, E, G, A
export const MAJOR_PENTATONIC: readonly number[] = [0, 2, 4, 7, 9]

export interface ScalePreset {
  name: string
  degrees: readonly number[]
}

// scale presets available in the mapping editor
export const SCALE_PRESETS: readonly ScalePreset[] = [
  { name: 'Major pentatonic', degrees: MAJOR_PENTATONIC },
  { name: 'Minor pentatonic', degrees: [0, 3, 5, 7, 10] },
  { name: 'Major', degrees: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Natural minor', degrees: [0, 2, 3, 5, 7, 8, 10] },
  {
    name: 'Chromatic',
    degrees: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  }
]

/**
 * maps normalized value to a MIDI note
 *
 * using a scale instead of raw semitones keeps the result musical while
 * preserving the ordering: a larger input value always produces a note
 * that is equal to or higher than the previous one.
 */
export function toMidiNote(
  norm: number,
  rootNote = 60,
  octaves = 2,
  scale: readonly number[] = MAJOR_PENTATONIC
): number {
  if (!Number.isFinite(norm)) {
    throw new Error(`Cannot map a non-finite value to a note: ${norm}`)
  }
  if (!Number.isInteger(rootNote) || rootNote < 0 || rootNote > 127) {
    throw new Error(`rootNote must be an integer between 0 and 127, got ${rootNote}`)
  }
  if (!Number.isInteger(octaves) || octaves < 1) {
    throw new Error(`octaves must be a positive integer, got ${octaves}`)
  }
  if (scale.length === 0) {
    throw new Error('Scale must contain at least one degree')
  }
  scale.forEach((degree, index) => {
    if (!Number.isInteger(degree) || degree < 0 || degree > 11) {
      throw new Error(`Scale degrees must be integers between 0 and 11, got ${degree}`)
    }
    if (index > 0 && degree <= scale[index - 1]) {
      throw new Error('Scale degrees must be strictly ascending')
    }
  })

  const degrees = scale.length * octaves
  const index = Math.min(degrees - 1, Math.floor(clamp01(norm) * degrees))
  const octave = Math.floor(index / scale.length)
  const degree = scale[index % scale.length]

  return Math.max(0, Math.min(127, rootNote + octave * 12 + degree))
}
