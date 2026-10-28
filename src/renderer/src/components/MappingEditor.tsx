import type { MappingEditorProps } from '@renderer/typedefs/mapping.typedefs'
import { DurationSection } from '@renderer/components/mapping/DurationSection'
import { GlobalSection } from '@renderer/components/mapping/GlobalSection'
import { InstrumentSection } from '@renderer/components/mapping/InstrumentSection'
import { PitchSection } from '@renderer/components/mapping/PitchSection'
import { TimeSection } from '@renderer/components/mapping/TimeSection'
import { VelocitySection } from '@renderer/components/mapping/VelocitySection'
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
