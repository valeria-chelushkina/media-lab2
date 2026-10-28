import { useCallback } from 'react'
import type { UsePlaybackTriggerProps } from '../typedefs/usePlaybackTrigger.typedefs'

export function usePlaybackTrigger({
  preview,
  config,
  play
}: UsePlaybackTriggerProps): () => Promise<void> {
  return useCallback(async (): Promise<void> => {
    if (!config || preview.error || preview.notes.length === 0) return
    await play(preview.notes, config.tempo)
  }, [config, preview, play])
}
