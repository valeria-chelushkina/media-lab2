import { useMemo, useState } from 'react'
import { createConfigForColumns, unmappedFields, type SonificationConfig } from '@core/config'
import type { Dataset } from '@core/types'
import { AppHeader } from '@renderer/components/AppHeader'
import { DatasetPanel } from '@renderer/components/DatasetPanel'
import { EmptyState } from '@renderer/components/EmptyState'
import { MappingPanel } from '@renderer/components/MappingPanel'
import { PreviewPanel } from '@renderer/components/PreviewPanel'
import { Toolbar } from '@renderer/components/Toolbar'
import { useGenerateMidi } from '@renderer/hooks/useGenerateMidi'
import { useLoadSample } from '@renderer/hooks/useLoadSample'
import { useOpenCsv } from '@renderer/hooks/useOpenCsv'
import { useOpenSavedMidi } from '@renderer/hooks/useOpenSavedMidi'
import { usePlayback } from '@renderer/hooks/usePlayback'
import { usePlaybackTrigger } from '@renderer/hooks/usePlaybackTrigger'
import { buildPreview } from '@renderer/lib/preview'
import type { LoadedDataset, Status } from '@renderer/types'
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

  const preview = useMemo(() => buildPreview(dataset, config), [dataset, config])
  const unmapped = dataset && config ? unmappedFields(dataset.columns, config) : []

  function handleLoaded(payload: LoadedDataset): void {
    setDataset(payload.dataset)
    setConfig(payload.config)
    setSourceName(payload.sourceName)
    setHasHeader(payload.hasHeader)
    setSavedPath(null)
  }

  const { playing, progress, play, stop } = usePlayback({
    onError: (message) => setStatus({ kind: 'error', message })
  })

  const openCsv = useOpenCsv({
    hasHeader,
    stopPlayback: stop,
    setBusy,
    setStatus,
    onLoaded: handleLoaded
  })

  const loadSample = useLoadSample({
    stopPlayback: stop,
    setBusy,
    setStatus,
    onLoaded: handleLoaded
  })

  const generate = useGenerateMidi({
    dataset,
    config,
    sourceName,
    stopPlayback: stop,
    setBusy,
    setStatus,
    setSavedPath
  })

  const openSaved = useOpenSavedMidi({
    savedPath,
    setStatus
  })

  const handlePlay = usePlaybackTrigger({ preview, config, play })

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
          onOpenCsv={() => void openCsv()}
          onLoadSample={(presetId) => void loadSample(presetId)}
          onGenerate={() => void generate()}
          onOpenSaved={() => void openSaved()}
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
          <EmptyState busy={busy} onLoadSample={(presetId) => void loadSample(presetId)} />
        )}
      </main>
    </div>
  )
}

export default App
