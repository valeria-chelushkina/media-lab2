import { MappingEditor } from '@renderer/components/MappingEditor'
import type { MappingPanelProps } from '@renderer/typedefs/mappingPanel.typedefs'

export function MappingPanel({
  dataset,
  config,
  unmapped,
  onConfigChange,
  onReset
}: MappingPanelProps): React.JSX.Element {
  return (
    <section className="panel mapping-panel">
      <div className="panel-heading">
        <h2>Mapping</h2>
        <button type="button" className="text-button" onClick={onReset}>
          Reset
        </button>
      </div>

      <MappingEditor columns={dataset.columns} config={config} onChange={onConfigChange} />

      {unmapped.length > 0 ? (
        <p className="mapping-warning">
          Unmapped indicators: {unmapped.join(', ')}. Every input column should affect at least one
          MIDI parameter.
        </p>
      ) : null}
    </section>
  )
}
