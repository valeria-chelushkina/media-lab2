export type NumericRow = Record<string, number>

export interface Dataset {
  columns: string[]
  rows: NumericRow[]
}

export interface NoteEvent {
  midi: number
  velocity: number
  timeBeats: number
  durationBeats: number
  instrument: number
}

export interface MidiBuildOptions {
  tempo: number
  // Time signature as [numerator, denominator]. Defaults to 4/4.
  timeSignature?: readonly [number, number]
  trackName?: string
}
