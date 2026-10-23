import { useMemo, useState } from 'react'
import { buildMidi } from '@core/buildMidi'
import { createConfigForColumns, unmappedFields, type SonificationConfig } from '@core/config'
import { getSamplePreset } from '@core/presets'
import { sonify } from '@core/sonify'
import type { Dataset } from '@core/types'
import { AppHeader } from './components/AppHeader'
import { DatasetPanel } from './components/DatasetPanel'
import { EmptyState } from './components/EmptyState'
import { MappingPanel } from './components/MappingPanel'
import { PreviewPanel } from './components/PreviewPanel'
import { Toolbar } from './components/Toolbar'
import { usePlayback } from './hooks/usePlayback'
import { baseName, toMessage } from './lib/format'
import { buildPreview } from './lib/preview'
import type { Status } from './types'

const INITIAL_STATUS: Status = {
  kind: 'idle',
  message: 'Open a CSV file with at least two numeric columns to begin.'
}

function App(): React.JSX.Element {
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [config, setConfig] = useState<SonificationConfig | null>(null)
  const [sourceName, setSourceName] = useState('sonification')
  const [status, setStatus] = useState<Status>(INITIAL_STATUS)
  const [busy, setBusy] = useState(false)
  const [hasHeader, setHasHeader] = useState(true)
  const [savedPath, setSavedPath] = useState<string | null>(null)

  const { playing, progress, play, stop } = usePlayback((message) =>
    setStatus({ kind: 'error', message })
  )

  const preview = useMemo(() => buildPreview(dataset, config), [dataset, config])
  const unmapped = dataset && config ? unmappedFields(dataset.columns, config) : []

  async function handlePlay(): Promise<void> {
    if (!config || preview.error || preview.notes.length === 0) return
    await play(preview.notes, config.tempo)
  }

  async function handleOpenCsv(): Promise<void> {
    if (!window.api) {
      setStatus({
        kind: 'error',
        message: 'Preload bridge is unavailable. Launch the app through Electron.'
      })
      return
    }

    stop()
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

      setDataset(result.dataset)
      setConfig(createConfigForColumns(result.dataset.columns))
      setSourceName(baseName(result.filePath))
      setSavedPath(null)
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

  async function handleLoadSample(presetId: string): Promise<void> {
    const preset = getSamplePreset(presetId)
    if (!preset || !window.api) return

    stop()
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

      setDataset(result.dataset)
      setConfig(structuredClone(preset.config))
      setSourceName(baseName(preset.file))
      setHasHeader(preset.header)
      setSavedPath(null)
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

  async function handleGenerate(): Promise<void> {
    if (!dataset || !config || !window.api) return

    stop()
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

  async function handleOpenSaved(): Promise<void> {
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

  function handleConfigChange(next: SonificationConfig): void {
    if (playing) stop()
    if (savedPath) {
      setSavedPath(null)
      setStatus({
        kind: 'idle',
        message: 'Mapping changed. Generate again to update the .mid file.'
      })
    }
    setConfig(next)
  }

  function handleReset(): void {
    if (!dataset) return
    stop()
    setSavedPath(null)
    setConfig(createConfigForColumns(dataset.columns))
    setStatus({ kind: 'idle', message: 'Mapping reset to defaults.' })
  }

  return (
    <div className="app">
      <AppHeader />

      <main className="workspace">
        <Toolbar
          hasHeader={hasHeader}
          status={status}
          busy={busy}
          canGenerate={Boolean(dataset && config)}
          hasSavedFile={Boolean(savedPath)}
          onHasHeaderChange={setHasHeader}
          onOpenCsv={() => void handleOpenCsv()}
          onLoadSample={(presetId) => void handleLoadSample(presetId)}
          onGenerate={() => void handleGenerate()}
          onOpenSaved={() => void handleOpenSaved()}
        />

        {dataset && config ? (
          <>
            <PreviewPanel
              preview={preview}
              playing={playing}
              progress={progress}
              onPlay={() => void handlePlay()}
            />

            <div className="content-grid">
              <DatasetPanel dataset={dataset} />
              <MappingPanel
                dataset={dataset}
                config={config}
                unmapped={unmapped}
                onConfigChange={handleConfigChange}
                onReset={handleReset}
              />
            </div>
          </>
        ) : (
          <EmptyState busy={busy} onLoadSample={(presetId) => void handleLoadSample(presetId)} />
        )}
      </main>
    </div>
  )
}

export default App
