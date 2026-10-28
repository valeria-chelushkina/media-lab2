import type { MappingSectionProps } from '../../typedefs/mapping.typedefs'
import { ColumnSelect } from './ColumnSelect'
import { Field } from './Field'
import { MappingSection } from './MappingSection'
import { RangeInput } from './RangeInput'

export function DurationSection({
  columns,
  config,
  onChange
}: MappingSectionProps): React.JSX.Element {
  return (
    <MappingSection title="Duration">
      <div className="control-grid">
        <Field label="Column">
          <ColumnSelect
            value={config.duration.field}
            columns={columns}
            onChange={(field) =>
              onChange({
                ...config,
                duration: { ...config.duration, field }
              })
            }
          />
        </Field>

        <Field label="Range (beats)" wide>
          <RangeInput
            minValue={config.duration.minBeats}
            maxValue={config.duration.maxBeats}
            min={0.05}
            max={16}
            step={0.05}
            onChange={(minBeats, maxBeats) =>
              onChange({
                ...config,
                duration: { ...config.duration, minBeats, maxBeats }
              })
            }
          />
        </Field>
      </div>
    </MappingSection>
  )
}
