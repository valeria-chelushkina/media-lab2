import { getSamplePreset } from '@core/presets'
import { baseName, toMessage } from '@renderer/lib/format'
import type { UseLoadSampleProps } from '@renderer/typedefs/useLoadSample.typedefs'
export function useLoadSample({
  stopPlayback,
  setBusy,
  setStatus,
  onLoaded
}: UseLoadSampleProps): (presetId: string) => Promise<void> {
  return async (presetId: string): Promise<void> => {
    const preset = getSamplePreset(presetId)
    if (!preset || !window.api) return

    stopPlayback()
    setBusy(true)
    setStatus({ kind: 'idle', message: `Loading ${preset.name}…` })

    try {
      const result = await window.api.openSample(presetId)

      if (result.error || !result.dataset) {
        setStatus({
          kind: 'error',
          message: result.error ?? 'The sample could not be loaded.'
        })
        return
      }

      onLoaded({
        dataset: result.dataset,
        config: structuredClone(preset.config),
        sourceName: baseName(preset.file),
        hasHeader: preset.header
      })

      setStatus({
        kind: 'success',
        message: `Loaded ${preset.name}: ${result.dataset.rows.length} rows, ${result.dataset.columns.length} columns.`
      })
    } catch (error) {
      setStatus({ kind: 'error', message: toMessage(error) })
    } finally {
      setBusy(false)
    }
  }
}
