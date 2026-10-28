import type { LoadedDataset, Status } from '@renderer/types'
export interface UseOpenCsvProps {
  hasHeader: boolean
  stopPlayback: () => void
  setBusy: (busy: boolean) => void
  setStatus: (status: Status) => void
  onLoaded: (payload: LoadedDataset) => void
}
