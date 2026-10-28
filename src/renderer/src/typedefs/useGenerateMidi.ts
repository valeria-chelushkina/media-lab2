import type { SonificationConfig } from '@core/config'
import type { Dataset } from '@core/types'
import type { Status } from '../types'

export interface UseGenerateMidiProps {
  dataset: Dataset | null
  config: SonificationConfig | null
  sourceName: string
  stopPlayback: () => void
  setBusy: (busy: boolean) => void
  setStatus: (status: Status) => void
  setSavedPath: (path: string | null) => void
}
