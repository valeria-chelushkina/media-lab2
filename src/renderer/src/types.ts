import type { NoteEvent } from '@core/types'

export type StatusKind = 'idle' | 'success' | 'warning' | 'error'

export interface Status {
  kind: StatusKind
  message: string
}

export interface Preview {
  notes: NoteEvent[]
  error: string | null
  durationSeconds: number
}
