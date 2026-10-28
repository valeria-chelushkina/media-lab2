import { describe, expect, it } from 'vitest'
import { MAJOR_PENTATONIC, toMidiNote } from '@core/scale'
describe('toMidiNote', () => {
  it('maps 0 to the root note and 1 to the highest degree', () => {
    expect(toMidiNote(0, 60, 2, MAJOR_PENTATONIC)).toBe(60)
    expect(toMidiNote(1, 60, 2, MAJOR_PENTATONIC)).toBe(81)
  })

  it('is monotonic across the whole normalized range', () => {
    let previous = -1

    for (let step = 0; step <= 100; step += 1) {
      const note = toMidiNote(step / 100, 60, 2, MAJOR_PENTATONIC)
      expect(note).toBeGreaterThanOrEqual(previous)
      previous = note
    }
  })

  it('clamps notes to the valid MIDI range', () => {
    expect(toMidiNote(1, 120, 3, MAJOR_PENTATONIC)).toBeLessThanOrEqual(127)
    expect(toMidiNote(0, 0, 1, MAJOR_PENTATONIC)).toBeGreaterThanOrEqual(0)
  })

  it('rejects an invalid scale', () => {
    expect(() => toMidiNote(0.5, 60, 2, [0, 4, 2])).toThrow(/ascending/)
    expect(() => toMidiNote(0.5, 60, 2, [0, 12])).toThrow(/between 0 and 11/)
    expect(() => toMidiNote(0.5, 60, 2, [])).toThrow(/at least one/)
  })
})
