/**
 * A single row of the input dataset. Every value is a finite number;
 * validation happens in the CSV loader before rows reach the mapping layer.
 */
export type NumericRow = Record<string, number>

export interface Dataset {
  columns: string[]
  rows: NumericRow[]
}

/** One generated note, expressed in musical units (not seconds). */
export interface NoteEvent {
  /** MIDI note number, 0-127. */
  midi: number
  /** MIDI velocity, 1-127. */
  velocity: number
  /** Start position in beats from the beginning of the piece. */
  timeBeats: number
  /** Note length in beats. */
  durationBeats: number
  /** General MIDI program number, 0-127. */
  instrument: number
}

export interface MidiBuildOptions {
  /** Tempo in beats per minute. */
  tempo: number
  /** Time signature as [numerator, denominator]. Defaults to 4/4. */
  timeSignature?: readonly [number, number]
  /** Base name for the generated track(s). */
  trackName?: string
}
