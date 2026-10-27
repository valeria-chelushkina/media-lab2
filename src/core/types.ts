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
  trackName?: string
}
