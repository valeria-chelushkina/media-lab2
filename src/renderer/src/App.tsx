import { useState } from 'react'
import { buildMidi } from '@core/buildMidi'
import { createConfigForColumns, type SonificationConfig } from '@core/config'
import { sonify } from '@core/sonify'
import type { Dataset } from '@core/types'

type StatusKind = 'idle' | 'success' | 'error'

interface Status {
  kind: StatusKind
  message: string
}

const INITIAL_STATUS: Status = {
  kind: 'idle',
  message: 'Open a CSV file with at least two numeric columns to begin.'
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function App(): React.JSX.Element {
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [config, setConfig] = useState<SonificationConfig | null>(null)
  const [sourceName, setSourceName] = useState('sonification')
  const [status, setStatus] = useState<Status>(INITIAL_STATUS)
  const [busy, setBusy] = useState(false)

  async function handleOpenCsv(): Promise<void> {
    if (!window.api) {
      setStatus({
        kind: 'error',
        message: 'Preload bridge is unavailable. Launch the app through Electron.'
      })
      return
    }

    setBusy(true)
    setStatus({ kind: 'idle', message: 'Waiting for a CSV file…' })

    try {
      const result = await window.api.openCsv()

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
      setStatus({
        kind: 'success',
        message: `Loaded ${result.dataset.rows.length} rows and ${result.dataset.columns.length} columns.`
      })
    } catch (error) {
      setStatus({ kind: 'error', message: toMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  async function handleGenerate(): Promise<void> {
    if (!dataset || !config || !window.api) return

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

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ♪
          </span>
          <div>
            <h1>Data Sonifier</h1>
            <p>Media Lab 2 · numeric data → MIDI</p>
          </div>
        </div>
        <span className="stack-badge">Electron · React · TypeScript</span>
      </header>

      <main className="workspace">
        <section className="panel toolbar">
          <div className="actions">
            <button
              type="button"
              className="button button-primary"
              onClick={handleOpenCsv}
              disabled={busy}
            >
              Open CSV
            </button>
            <button
              type="button"
              className="button"
              onClick={handleGenerate}
              disabled={!dataset || !config || busy}
            >
              Generate &amp; Save .mid
            </button>
          </div>
          <p className={`status status-${status.kind}`} role="status" aria-live="polite">
            {status.message}
          </p>
        </section>

        {dataset && config ? (
          <div className="content-grid">
            <section className="panel">
              <div className="panel-heading">
                <h2>Dataset</h2>
                <span>
                  {dataset.rows.length} rows · {dataset.columns.length} columns
                </span>
              </div>

              <div className="table-wrap">
                <table className="data-table">
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

            <section className="panel">
              <div className="panel-heading">
                <h2>Mapping</h2>
                <span>auto-selected</span>
              </div>

              <div className="mapping-list">
                <MappingRow
                  label="Pitch"
                  field={config.pitch.field}
                  detail={`root ${midiName(config.pitch.rootNote)} · ${config.pitch.octaves} octave${
                    config.pitch.octaves === 1 ? '' : 's'
                  } · ${config.pitch.scale.length} degrees/octave`}
                />
                <MappingRow
                  label="Velocity"
                  field={config.velocity.field}
                  detail={`${config.velocity.min}–${config.velocity.max}`}
                />
                <MappingRow
                  label="Duration"
                  field={config.duration.field}
                  detail={`${config.duration.minBeats}–${config.duration.maxBeats} beat`}
                />
                <MappingRow label="Instrument" field="fixed" detail="program 0 · piano" />
              </div>

              <div className="mapping-footer">
                <span>Tempo</span>
                <strong>{config.tempo} BPM</strong>
              </div>
            </section>
          </div>
        ) : (
          <section className="panel empty-state">
            <h2>No dataset loaded</h2>
            <p>
              Open a CSV where every column is numeric. The first three columns are mapped to pitch,
              velocity, and duration using the project defaults.
            </p>
            <p className="empty-hint">
              Try <code>data/weather.csv</code>.
            </p>
          </section>
        )}
      </main>

      <footer className="app-footer">v0.1.0 · local desktop app · MIDI output</footer>
    </div>
  )
}

interface MappingRowProps {
  label: string
  field: string
  detail: string
}

function MappingRow({ label, field, detail }: MappingRowProps): React.JSX.Element {
  return (
    <div className="mapping-row">
      <span className="mapping-label">{label}</span>
      <code className="mapping-field">{field}</code>
      <span className="mapping-detail">{detail}</span>
    </div>
  )
}

function midiName(note: number): string {
  const name = NOTE_NAMES[((note % 12) + 12) % 12]
  const octave = Math.floor(note / 12) - 1
  return `${name}${octave}`
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
