import { Midi } from '@tonejs/midi'
import { describe, expect, it } from 'vitest'
import { buildMidi } from '@core/buildMidi'
import type { SonificationConfig } from '@core/config'
import { sonify } from '@core/sonify'
import type { NumericRow } from '@core/types'
const rows: NumericRow[] = [
  { energy: 10, valence: 20, danceability: 30, texture: 10, timestamp: 0 },
  { energy: 20, valence: 50, danceability: 40, texture: 50, timestamp: 4 },
  { energy: 30, valence: 80, danceability: 50, texture: 90, timestamp: 8 }
]

const config: SonificationConfig = {
  tempo: 120,
  beatsPerRow: 1,
  pitch: {
    field: 'energy',
    rootNote: 60,
    octaves: 2,
    scale: [0, 2, 4, 7, 9]
  },
  velocity: { field: 'valence', min: 30, max: 120 },
  duration: { field: 'danceability', minBeats: 0.25, maxBeats: 0.9 },
  time: { mode: 'field', field: 'timestamp', minBeats: 0, maxBeats: 8 },
  instrument: { mode: 'field', field: 'texture', programs: [0, 24] }
}

describe('five-column sonification pipeline', () => {
  it('uses every mapped column and produces a playable MIDI structure', () => {
    const notes = sonify(rows, config)

    expect(notes.map((note) => note.timeBeats)).toEqual([0, 4, 8])
    expect(notes.map((note) => note.instrument)).toEqual([0, 24, 24])

    const midi = buildMidi(notes, { tempo: 120, trackName: 'Five columns' })
    const parsed = new Midi(midi.toArray())

    expect(parsed.tracks).toHaveLength(2)
    expect(parsed.tracks.map((track) => track.instrument.number)).toEqual([0, 24])
    expect(parsed.tracks[0].notes).toHaveLength(1)
    expect(parsed.tracks[1].notes).toHaveLength(2)
    expect(parsed.tracks[1].notes.map((note) => note.time)).toEqual([2, 4])
  })
})
