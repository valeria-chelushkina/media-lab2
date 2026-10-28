import type { LoadedDataset, Status } from '../types'

export interface UseLoadSampleProps {
  stopPlayback: () => void
  setBusy: (busy: boolean) => void
  setStatus: (status: Status) => void
  onLoaded: (payload: LoadedDataset) => void
}
