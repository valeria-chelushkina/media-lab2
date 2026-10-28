import type { MappingEditorProps } from '../typedefs/mapping'
import { DurationSection } from './mapping/DurationSection'
import { GlobalSection } from './mapping/GlobalSection'
import { InstrumentSection } from './mapping/InstrumentSection'
import { PitchSection } from './mapping/PitchSection'
import { TimeSection } from './mapping/TimeSection'
import { VelocitySection } from './mapping/VelocitySection'

export function MappingEditor({
  columns,
  config,
  onChange
}: MappingEditorProps): React.JSX.Element {
  return (
    <div className="mapping-editor">
      <PitchSection columns={columns} config={config} onChange={onChange} />
      <VelocitySection columns={columns} config={config} onChange={onChange} />
      <DurationSection columns={columns} config={config} onChange={onChange} />
      <TimeSection columns={columns} config={config} onChange={onChange} />
      <InstrumentSection columns={columns} config={config} onChange={onChange} />
      <GlobalSection config={config} onChange={onChange} />
    </div>
  )
}
