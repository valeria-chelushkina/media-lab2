import { SAMPLE_PRESETS } from '@core/presets'
import type { ToolbarProps } from '@renderer/typedefs/toolbar.typedefs'

export function Toolbar({
  hasHeader,
  status,
  busy,
  canGenerate,
  hasSavedFile,
  onHasHeaderChange,
  onOpenCsv,
  onLoadSample,
  onGenerate,
  onOpenSaved
}: ToolbarProps): React.JSX.Element {
  return (
    <section className="panel toolbar">
      <div className="actions">
        <label
          className="header-toggle"
          title="Uncheck if the first row contains data instead of column names"
        >
          <input
            type="checkbox"
            checked={hasHeader}
            onChange={(event) => onHasHeaderChange(event.target.checked)}
          />
          First row is header
        </label>

        <button type="button" className="button button-primary" onClick={onOpenCsv} disabled={busy}>
          Open CSV
        </button>

        <select
          className="sample-select"
          value=""
          onChange={(event) => {
            const presetId = event.target.value
            event.target.value = ''
            if (presetId) onLoadSample(presetId)
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
          onClick={onGenerate}
          disabled={!canGenerate || busy}
        >
          Generate &amp; Save .mid
        </button>

        {hasSavedFile ? (
          <button
            type="button"
            className="button"
            onClick={onOpenSaved}
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
  )
}
