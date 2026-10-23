import type { SonificationConfig } from '@core/config'
import { sonify } from '@core/sonify'
import type { Dataset } from '@core/types'
import type { Preview } from '../types'
import { toMessage } from './format'

export function buildPreview(dataset: Dataset | null, config: SonificationConfig | null): Preview {
  if (!dataset || !config) {
    return { notes: [], error: null, durationSeconds: 0 }
  }

  try {
    const notes = sonify(dataset.rows, config)
    const totalBeats = notes.reduce(
      (max, note) => Math.max(max, note.timeBeats + note.durationBeats),
      0
    )
    return {
      notes,
      error: null,
      durationSeconds: (totalBeats * 60) / config.tempo
    }
  } catch (error) {
    return { notes: [], error: toMessage(error), durationSeconds: 0 }
  }
}
