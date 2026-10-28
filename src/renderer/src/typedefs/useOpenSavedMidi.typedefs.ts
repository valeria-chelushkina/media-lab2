import type { Status } from '@renderer/types'
export interface UseOpenSavedMidiProps {
  savedPath: string | null
  setStatus: (status: Status) => void
}
