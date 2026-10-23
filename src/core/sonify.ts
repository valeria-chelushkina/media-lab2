import { sonificationConfigSchema, type SonificationConfig } from './config'
import { lerp, makeNormalizer } from './normalize'
import { toMidiNote } from './scale'
import type { NoteEvent, NumericRow } from './types'

/**
 * Converts numeric rows into note events.
 *
 * Each configured field is normalized independently with min-max, then mapped
 * to its MIDI parameter. The function is pure and deterministic: the same rows
 * and config always produce the same notes.
 */
export function sonify(rows: readonly NumericRow[], config: SonificationConfig): NoteEvent[] {
  const cfg = sonificationConfigSchema.parse(config)

  if (rows.length === 0) {
    throw new Error('Cannot sonify an empty dataset')
  }

  const pitchNorm = makeNormalizer(series(rows, cfg.pitch.field))
  const velocityNorm = makeNormalizer(series(rows, cfg.velocity.field))
  const durationNorm = makeNormalizer(series(rows, cfg.duration.field))

  const time = cfg.time ?? { mode: 'row' as const }
  const timeNorm = time.mode === 'field' ? makeNormalizer(series(rows, time.field)) : null

  const instrument = cfg.instrument
  const instrumentNorm =
    instrument?.mode === 'field' ? makeNormalizer(series(rows, instrument.field)) : null

  return rows.map((row, index) => {
    const pitch = pitchNorm(row[cfg.pitch.field])
    const velocity = velocityNorm(row[cfg.velocity.field])
    const duration = durationNorm(row[cfg.duration.field])

    const timeBeats =
      time.mode === 'field' && timeNorm
        ? lerp(time.minBeats, time.maxBeats, timeNorm(row[time.field]))
        : index * cfg.beatsPerRow

    const program =
      instrument?.mode === 'fixed'
        ? instrument.program
        : instrument && instrumentNorm
          ? pickProgram(instrument.programs, row[instrument.field], instrumentNorm)
          : 0

    return {
      midi: toMidiNote(pitch, cfg.pitch.rootNote, cfg.pitch.octaves, cfg.pitch.scale),
      velocity: Math.round(lerp(cfg.velocity.min, cfg.velocity.max, velocity)),
      timeBeats,
      durationBeats: lerp(cfg.duration.minBeats, cfg.duration.maxBeats, duration),
      instrument: program
    }
  })
}

function series(rows: readonly NumericRow[], field: string): number[] {
  return rows.map((row, index) => {
    const value = row[field]
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`Row ${index + 1}: field "${field}" is missing or is not a finite number`)
    }
    return value
  })
}

function pickProgram(
  programs: readonly number[],
  value: number,
  normalizer: (value: number) => number
): number {
  if (programs.length === 0) return 0

  const normalized = normalizer(value)
  const index = Math.min(programs.length - 1, Math.floor(normalized * programs.length))
  return programs[index]
}
