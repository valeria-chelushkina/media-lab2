import type { NoteEvent } from '@core/types'

export interface PianoRollProps {
  notes: readonly NoteEvent[]
  progress: number
}
