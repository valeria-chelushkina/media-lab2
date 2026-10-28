import type { MappingSectionProps } from '../../typedefs/mapping'
import { ColumnSelect } from './ColumnSelect'
import { Field } from './Field'
import { MappingSection } from './MappingSection'
import { RangeInput } from './RangeInput'

export function VelocitySection({
  columns,
  config,
  onChange
}: MappingSectionProps): React.JSX.Element {
  return (
    <MappingSection title="Velocity">
      <div className="control-grid">
        <Field label="Column">
          <ColumnSelect
            value={config.velocity.field}
            columns={columns}
            onChange={(field) =>
              onChange({
                ...config,
                velocity: { ...config.velocity, field }
              })
            }
          />
        </Field>

        <Field label="Range (1–127)" wide>
          <RangeInput
            minValue={config.velocity.min}
            maxValue={config.velocity.max}
            min={1}
            max={127}
            onChange={(min, max) =>
              onChange({ ...config, velocity: { ...config.velocity, min, max } })
            }
          />
        </Field>
      </div>
    </MappingSection>
  )
}
