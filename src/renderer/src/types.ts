import type { SonificationConfig } from '@core/config'
import type { Dataset, NoteEvent } from '@core/types'

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

export interface LoadedDataset {
  dataset: Dataset
  config: SonificationConfig
  sourceName: string
  hasHeader: boolean
}
