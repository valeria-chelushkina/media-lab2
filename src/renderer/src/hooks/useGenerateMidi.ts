import { buildMidi } from '@core/buildMidi'
import { sonify } from '@core/sonify'
import { toMessage } from '../lib/format'
import type { UseGenerateMidiProps } from '../typedefs/useGenerateMidi'

export function useGenerateMidi({
  dataset,
  config,
  sourceName,
  stopPlayback,
  setBusy,
  setStatus,
  setSavedPath
}: UseGenerateMidiProps): () => Promise<void> {
  return async (): Promise<void> => {
    if (!dataset || !config || !window.api) return

    stopPlayback()
    setBusy(true)
    setStatus({ kind: 'idle', message: 'Generating MIDI…' })

    try {
      const notes = sonify(dataset.rows, config)
      const midi = buildMidi(notes, {
        tempo: config.tempo,
        trackName: `${sourceName} sonification`
      })
      const result = await window.api.saveMidi(midi.toArray(), `${sourceName}.mid`)

      if (result.canceled) {
        setStatus({ kind: 'idle', message: 'Save canceled.' })
        return
      }

      if (result.error) {
        setStatus({ kind: 'error', message: result.error })
        return
      }

      setSavedPath(result.filePath ?? null)
      setStatus({
        kind: 'success',
        message: `Saved ${notes.length} notes to ${result.filePath ?? 'the selected file'}.`
      })
    } catch (error) {
      setStatus({ kind: 'error', message: toMessage(error) })
    } finally {
      setBusy(false)
    }
  }
}
