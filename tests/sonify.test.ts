import { describe, expect, it } from 'vitest'
import { defaultConfig, type SonificationConfig } from '@core/config'
import { sonify } from '@core/sonify'
import type { NumericRow } from '@core/types'
const rows: NumericRow[] = [
  { temperature: 10, humidity: 40, pressure: 1000 },
  { temperature: 20, humidity: 60, pressure: 1010 },
  { temperature: 30, humidity: 80, pressure: 1020 }
]

describe('sonify', () => {
  it('produces one note per data row', () => {
    expect(sonify(rows, defaultConfig)).toHaveLength(rows.length)
  })

  it('maps the first row to the low end and the last row to the high end', () => {
    const notes = sonify(rows, defaultConfig)

    expect(notes[0].midi).toBe(60)
    expect(notes[2].midi).toBe(81)
    expect(notes[0].velocity).toBe(30)
    expect(notes[2].velocity).toBe(120)
    expect(notes[0].durationBeats).toBeCloseTo(0.25)
    expect(notes[2].durationBeats).toBeCloseTo(0.9)
  })

  it('places notes on the configured beat grid', () => {
    const notes = sonify(rows, defaultConfig)

    expect(notes.map((note) => note.timeBeats)).toEqual([0, 1, 2])
  })

  it('lets each indicator drive a different parameter', () => {
    const humidityRows: NumericRow[] = [
      { temperature: 10, humidity: 0, pressure: 1000 },
      { temperature: 10, humidity: 50, pressure: 1000 },
      { temperature: 10, humidity: 100, pressure: 1000 }
    ]

    const notes = sonify(humidityRows, defaultConfig)

    expect(new Set(notes.map((note) => note.midi)).size).toBe(1)
    expect(new Set(notes.map((note) => note.durationBeats)).size).toBe(1)
    expect(notes[0].velocity).toBe(30)
    expect(notes[2].velocity).toBe(120)
    expect(notes[0].velocity).not.toBe(notes[2].velocity)
  })

  it('maps an optional instrument indicator to General MIDI programs', () => {
    const config: SonificationConfig = {
      ...defaultConfig,
      instrument: {
        mode: 'field',
        field: 'humidity',
        programs: [0, 24]
      }
    }

    const notes = sonify(rows, config)

    expect(notes[0].instrument).toBe(0)
    expect(notes[2].instrument).toBe(24)
  })

  it('maps a time column to note onsets', () => {
    const config: SonificationConfig = {
      ...defaultConfig,
      time: {
        mode: 'field',
        field: 'pressure',
        minBeats: 0,
        maxBeats: 8
      }
    }

    const notes = sonify(rows, config)

    expect(notes[0].timeBeats).toBe(0)
    expect(notes[2].timeBeats).toBe(8)
  })

  it('rejects rows with a missing indicator', () => {
    const brokenRows: NumericRow[] = [{ temperature: 10, humidity: 40 }]

    expect(() => sonify(brokenRows, defaultConfig)).toThrow(/pressure/)
  })

  it('rejects an invalid mapping config', () => {
    const invalidConfig: SonificationConfig = {
      ...defaultConfig,
      velocity: { field: 'humidity', min: 200, max: 300 }
    }

    expect(() => sonify(rows, invalidConfig)).toThrow()
  })

  it('is deterministic', () => {
    expect(sonify(rows, defaultConfig)).toEqual(sonify(rows, defaultConfig))
  })
})
