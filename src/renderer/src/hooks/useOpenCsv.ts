import { createConfigForColumns } from '@core/config'
import { baseName, toMessage } from '../lib/format'
import type { UseOpenCsvProps } from '../typedefs/useOpenCsv'

export function useOpenCsv({
  hasHeader,
  stopPlayback,
  setBusy,
  setStatus,
  onLoaded
}: UseOpenCsvProps): () => Promise<void> {
  return async (): Promise<void> => {
    if (!window.api) {
      setStatus({
        kind: 'error',
        message: 'Preload bridge is unavailable. Launch the app through Electron.'
      })
      return
    }

    stopPlayback()
    setBusy(true)
    setStatus({ kind: 'idle', message: 'Waiting for a CSV file…' })

    try {
      const result = await window.api.openCsv(hasHeader)

      if (result.canceled) {
        setStatus({ kind: 'idle', message: 'Open canceled.' })
        return
      }

      if (result.error || !result.dataset) {
        setStatus({
          kind: 'error',
          message: result.error ?? 'The selected file did not contain a dataset.'
        })
        return
      }

      onLoaded({
        dataset: result.dataset,
        config: createConfigForColumns(result.dataset.columns),
        sourceName: baseName(result.filePath),
        hasHeader
      })

      setStatus({
        kind: result.warning ? 'warning' : 'success',
        message: result.warning
          ? `Loaded ${result.dataset.rows.length} rows. ${result.warning}`
          : `Loaded ${result.dataset.rows.length} rows and ${result.dataset.columns.length} columns.`
      })
    } catch (error) {
      setStatus({ kind: 'error', message: toMessage(error) })
    } finally {
      setBusy(false)
    }
  }
}
