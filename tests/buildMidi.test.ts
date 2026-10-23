import { Midi } from '@tonejs/midi'
import { describe, expect, it } from 'vitest'
import { buildMidi, midiToBytes } from '../src/core/buildMidi'
import type { NoteEvent } from '../src/core/types'

function note(overrides: Partial<NoteEvent> = {}): NoteEvent {
  return {
    midi: 60,
    velocity: 64,
    timeBeats: 0,
    durationBeats: 0.5,
    instrument: 0,
    controlChanges: [],
    ...overrides
  }
}

const notes: NoteEvent[] = [
  note({ midi: 60, velocity: 64 }),
  note({ midi: 64, velocity: 100, timeBeats: 1 })
]

describe('buildMidi', () => {
  it('writes a valid Standard MIDI File header', () => {
    const bytes = midiToBytes(buildMidi(notes, { tempo: 120 }))

    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('MThd')
  })

  it('preserves tempo, pitch, velocity, timing and duration', () => {
    const midi = buildMidi(notes, { tempo: 120, trackName: 'Test' })
    const parsed = new Midi(midi.toArray())

    expect(parsed.header.tempos[0].bpm).toBeCloseTo(120, 5)
    expect(parsed.tracks).toHaveLength(1)
    expect(parsed.tracks[0].name).toBe('Test')
    expect(parsed.tracks[0].notes).toHaveLength(2)

    const first = parsed.tracks[0].notes.find((entry) => entry.midi === 60)
    expect(first).toBeDefined()
    expect(first?.time).toBeCloseTo(0)
    expect(first?.duration).toBeCloseTo(0.25)
    expect(first?.velocity).toBeCloseTo(64 / 127)
  })

  it('writes control changes at the note onset', () => {
    const midi = buildMidi(
      [
        note({
          controlChanges: [{ number: 10, value: 64 }]
        })
      ],
      { tempo: 100 }
    )
    const parsed = new Midi(midi.toArray())

    const controller = parsed.tracks[0].controlChanges[10]?.[0]
    expect(controller).toBeDefined()
    expect(controller?.value).toBeCloseTo(64 / 127)
    expect(controller?.time).toBeCloseTo(0)
  })

  it('creates one track per instrument and assigns distinct channels', () => {
    const midi = buildMidi(
      [
        note({ midi: 60, velocity: 80, durationBeats: 1, instrument: 0 }),
        note({ midi: 67, velocity: 90, timeBeats: 1, durationBeats: 1, instrument: 24 })
      ],
      { tempo: 100, trackName: 'Instruments' }
    )

    expect(midi.tracks).toHaveLength(2)
    expect(midi.tracks.map((track) => track.instrument.number)).toEqual([0, 24])
    expect(midi.tracks[0].channel).not.toBe(midi.tracks[1].channel)
  })

  it('is byte-for-byte deterministic', () => {
    const first = midiToBytes(buildMidi(notes, { tempo: 100 }))
    const second = midiToBytes(buildMidi(notes, { tempo: 100 }))

    expect(Array.from(first)).toEqual(Array.from(second))
  })

  it('rejects empty input and invalid notes', () => {
    expect(() => buildMidi([], { tempo: 100 })).toThrow(/without notes/)
    expect(() => buildMidi([note({ midi: 200 })], { tempo: 100 })).toThrow(/note number/)
    expect(() => buildMidi([note({ velocity: 0 })], { tempo: 100 })).toThrow(/velocity/)
    expect(() =>
      buildMidi([note({ controlChanges: [{ number: 200, value: 64 }] })], { tempo: 100 })
    ).toThrow(/controller number/)
  })
})
