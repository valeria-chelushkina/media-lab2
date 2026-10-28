import type { MappingSectionProps } from '../../typedefs/mapping'
import { ColumnSelect } from './ColumnSelect'
import { Field } from './Field'
import { MappingSection } from './MappingSection'
import { NumberInput } from './NumberInput'
import { RangeInput } from './RangeInput'

export function TimeSection({ columns, config, onChange }: MappingSectionProps): React.JSX.Element {
  const time = config.time ?? { mode: 'row' as const }

  return (
    <MappingSection title="Time">
      <div className="control-grid">
        <Field label="Mode">
          <select
            value={time.mode}
            onChange={(event) => {
              if (event.target.value === 'row') {
                onChange({ ...config, time: { mode: 'row' } })
              } else {
                onChange({
                  ...config,
                  time: {
                    mode: 'field',
                    field: columns[3] ?? columns[0],
                    minBeats: 0,
                    maxBeats: 16
                  }
                })
              }
            }}
          >
            <option value="row">Row grid</option>
            <option value="field">From column</option>
          </select>
        </Field>

        {time.mode === 'row' ? (
          <Field label="Beats per row">
            <NumberInput
              value={config.beatsPerRow}
              min={0.1}
              max={16}
              step={0.1}
              onChange={(beatsPerRow) => onChange({ ...config, beatsPerRow })}
            />
          </Field>
        ) : (
          <>
            <Field label="Column">
              <ColumnSelect
                value={time.field}
                columns={columns}
                onChange={(field) => onChange({ ...config, time: { ...time, field } })}
              />
            </Field>

            <Field label="Range (beats)" wide>
              <RangeInput
                minValue={time.minBeats}
                maxValue={time.maxBeats}
                min={0}
                max={128}
                step={0.5}
                onChange={(minBeats, maxBeats) =>
                  onChange({
                    ...config,
                    time: { ...time, minBeats, maxBeats }
                  })
                }
              />
            </Field>
          </>
        )}
      </div>
    </MappingSection>
  )
}
