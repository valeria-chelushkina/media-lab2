import type { SonificationConfig } from '@core/config'
import type { NoteEvent } from '@core/types'
import type { Preview } from '../types'

export interface UsePlaybackTriggerProps {
  preview: Preview
  config: SonificationConfig | null
  play: (notes: readonly NoteEvent[], tempo: number) => Promise<void>
}
