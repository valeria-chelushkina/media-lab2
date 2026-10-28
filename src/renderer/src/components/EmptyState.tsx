import { SAMPLE_PRESETS } from '@core/presets'
import type { EmptyStateProps } from '@renderer/typedefs/emptyState.typedefs'

export function EmptyState({ busy, onLoadSample }: EmptyStateProps): React.JSX.Element {
  return (
    <section className="panel empty-state">
      <h2>No dataset loaded</h2>
      <p>
        Open a CSV where every column is numeric. The first three columns are mapped to pitch,
        velocity, and duration by default — then you can remap any column to any MIDI parameter.
      </p>
      <p className="empty-hint">
        Pick a sample below, or open your own CSV. If your file has no header row, uncheck “First
        row is header” first.
      </p>

      <div className="sample-grid">
        {SAMPLE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="sample-card"
            onClick={() => onLoadSample(preset.id)}
            disabled={busy}
          >
            <strong>{preset.name}</strong>
            <span>{preset.description}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
