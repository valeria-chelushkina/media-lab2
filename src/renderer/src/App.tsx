import { useEffect, useMemo, useRef, useState } from 'react'
import { buildMidi } from '@core/buildMidi'
import { createConfigForColumns, unmappedFields, type SonificationConfig } from '@core/config'
import { getSamplePreset, SAMPLE_PRESETS } from '@core/presets'
import { sonify } from '@core/sonify'
import type { Dataset, NoteEvent } from '@core/types'
import { MappingEditor } from './components/MappingEditor'
import { PianoRoll } from './components/PianoRoll'
import { playNotes, type PlaybackHandle } from './lib/playback'

type StatusKind = 'idle' | 'success' | 'warning' | 'error'

interface Status {
  kind: StatusKind
  message: string
}

interface Preview {
  notes: NoteEvent[]
  error: string | null
  durationSeconds: number
}

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
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const playbackRef = useRef<PlaybackHandle | null>(null)
  const rafRef = useRef<number | null>(null)

  const preview = useMemo<Preview>(() => {
    if (!dataset || !config) {
      return { notes: [], error: null, durationSeconds: 0 }
    }

    try {
      const notes = sonify(dataset.rows, config)
      const totalBeats = notes.reduce(
        (max, note) => Math.max(max, note.timeBeats + note.durationBeats),
        0
      )
      return {
        notes,
        error: null,
        durationSeconds: (totalBeats * 60) / config.tempo
      }
    } catch (error) {
      return { notes: [], error: toMessage(error), durationSeconds: 0 }
    }
  }, [dataset, config])

  const unmapped = dataset && config ? unmappedFields(dataset.columns, config) : []

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      playbackRef.current?.stop()
    }
  }, [])

  function stopPlayback(): void {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    playbackRef.current?.stop()
    playbackRef.current = null
    setPlaying(false)
    setProgress(0)
  }

  async function handlePlay(): Promise<void> {
    if (playing) {
      stopPlayback()
      return
    }
    if (!config || preview.error || preview.notes.length === 0) return

    stopPlayback()

    try {
      const handle = await playNotes(preview.notes, config.tempo)
      playbackRef.current = handle
      setPlaying(true)

      const started = performance.now()
      const totalMs = Math.max(1, handle.durationSeconds * 1000)

      const tick = (now: number): void => {
        const next = Math.min(1, (now - started) / totalMs)
        setProgress(next)

        if (next < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          stopPlayback()
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    } catch (error) {
      stopPlayback()
      setStatus({ kind: 'error', message: toMessage(error) })
    }
  }

  async function handleOpenCsv(): Promise<void> {
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
    if (playing) stopPlayback()
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
    stopPlayback()
    setSavedPath(null)
    setConfig(createConfigForColumns(dataset.columns))
    setStatus({ kind: 'idle', message: 'Mapping reset to defaults.' })
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ♪
          </span>
          <h1>Data Sonifier</h1>
        </div>
      </header>

      <main className="workspace">
        <section className="panel toolbar">
          <div className="actions">
            <label
              className="header-toggle"
              title="Uncheck if the first row contains data instead of column names"
            >
              <input
                type="checkbox"
                checked={hasHeader}
                onChange={(event) => setHasHeader(event.target.checked)}
              />
              First row is header
            </label>
            <button
              type="button"
              className="button button-primary"
              onClick={handleOpenCsv}
              disabled={busy}
            >
              Open CSV
            </button>
            <select
              className="sample-select"
              value=""
              onChange={(event) => {
                const presetId = event.target.value
                event.target.value = ''
                if (presetId) void handleLoadSample(presetId)
              }}
              disabled={busy}
              title="Load a bundled sample dataset and its suggested mapping"
            >
              <option value="">Load sample…</option>
              {SAMPLE_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="button"
              onClick={handleGenerate}
              disabled={!dataset || !config || busy}
            >
              Generate &amp; Save .mid
            </button>
            {savedPath ? (
              <button
                type="button"
                className="button"
                onClick={() => void handleOpenSaved()}
                disabled={busy}
                title="Open the saved .mid in the default MIDI application"
              >
                Open in player
              </button>
            ) : null}
          </div>
          <p className={`status status-${status.kind}`} role="status" aria-live="polite">
            {status.message}
          </p>
        </section>

        {dataset && config ? (
          <section className="panel preview-panel">
            <div className="panel-heading preview-heading">
              <div className="preview-title">
                <h2>Piano roll</h2>
                <span>
                  {preview.error
                    ? 'Mapping error'
                    : `${preview.notes.length} notes · ${preview.durationSeconds.toFixed(2)} s`}
                </span>
              </div>
              <button
                type="button"
                className="button button-primary preview-play"
                onClick={() => void handlePlay()}
                disabled={preview.notes.length === 0 || Boolean(preview.error)}
              >
                {playing ? 'Stop' : 'Play'}
              </button>
            </div>

            <p className="preview-note">
              Synth preview only. The saved <code>.mid</code> uses General MIDI and may sound
              different in a DAW or online player.
            </p>

            {preview.error ? (
              <p className="preview-error">{preview.error}</p>
            ) : (
              <PianoRoll notes={preview.notes} progress={progress} />
            )}
          </section>
        ) : null}

        {dataset && config ? (
          <div className="content-grid">
            <section className="panel dataset-panel">
              <div className="panel-heading">
                <h2>Dataset</h2>
                <span>
                  {dataset.rows.length} rows · {dataset.columns.length} columns
                </span>
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <colgroup>
                    {dataset.columns.map((column) => (
                      <col key={column} style={{ width: `${100 / dataset.columns.length}%` }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      {dataset.columns.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.rows.slice(0, 8).map((row, index) => (
                      <tr key={index}>
                        {dataset.columns.map((column) => (
                          <td key={column}>{formatNumber(row[column])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {dataset.rows.length > 8 ? (
                <p className="table-note">Showing the first 8 of {dataset.rows.length} rows.</p>
              ) : null}
            </section>

            <section className="panel mapping-panel">
              <div className="panel-heading">
                <h2>Mapping</h2>
                <button type="button" className="text-button" onClick={handleReset}>
                  Reset
                </button>
              </div>

              <MappingEditor
                columns={dataset.columns}
                config={config}
                onChange={handleConfigChange}
              />

              {unmapped.length > 0 ? (
                <p className="mapping-warning">
                  Unmapped indicators: {unmapped.join(', ')}. Every input column should affect at
                  least one MIDI parameter.
                </p>
              ) : null}
            </section>
          </div>
        ) : (
          <section className="panel empty-state">
            <h2>No dataset loaded</h2>
            <p>
              Open a CSV where every column is numeric. The first three columns are mapped to pitch,
              velocity, and duration by default — then you can remap any column to any MIDI
              parameter.
            </p>
            <p className="empty-hint">
              Pick a sample below, or open your own CSV. If your file has no header row, uncheck
              “First row is header” first.
            </p>

            <div className="sample-grid">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="sample-card"
                  onClick={() => void handleLoadSample(preset.id)}
                  disabled={busy}
                >
                  <strong>{preset.name}</strong>
                  <span>{preset.description}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function formatNumber(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '—'
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function baseName(filePath?: string): string {
  if (!filePath) return 'sonification'
  const name = filePath.split(/[\\/]/).pop() ?? 'sonification'
  return name.replace(/\.[^.]+$/, '') || 'sonification'
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export default App
