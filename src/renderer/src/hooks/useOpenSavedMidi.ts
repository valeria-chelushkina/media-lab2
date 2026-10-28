import { toMessage } from '../lib/format'
import type { UseOpenSavedMidiProps } from '../typedefs/useOpenSavedMidi.typedefs'

export function useOpenSavedMidi({
  savedPath,
  setStatus
}: UseOpenSavedMidiProps): () => Promise<void> {
  return async (): Promise<void> => {
    if (!savedPath || !window.api) return

    try {
      const result = await window.api.openMidi(savedPath)
      if (result.error) {
        setStatus({ kind: 'error', message: result.error })
        return
      }
      setStatus({
        kind: 'success',
        message: `Opened ${savedPath} in the default player.`
      })
    } catch (error) {
      setStatus({ kind: 'error', message: toMessage(error) })
    }
  }
}
