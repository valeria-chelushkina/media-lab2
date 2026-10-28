import type { Status } from '../types'

export interface UseOpenSavedMidiProps {
  savedPath: string | null
  setStatus: (status: Status) => void
}
