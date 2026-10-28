import { INSTRUMENT_PRESETS } from '@core/instruments'
import type { MappingSectionProps } from '../../typedefs/mapping.typedefs'
import { ColumnSelect } from './ColumnSelect'
import { Field } from './Field'
import { MappingSection } from './MappingSection'

export function InstrumentSection({
  columns,
  config,
  onChange
}: MappingSectionProps): React.JSX.Element {
  const instrument = config.instrument ?? { mode: 'fixed' as const, program: 0 }

  function toggleProgram(program: number, checked: boolean): void {
    if (instrument.mode !== 'field') return

    const programs = checked
      ? Array.from(new Set([...instrument.programs, program])).sort((left, right) => left - right)
      : instrument.programs.filter((value) => value !== program)

    if (programs.length === 0) return
    onChange({ ...config, instrument: { ...instrument, programs } })
  }

  return (
    <MappingSection title="Instrument">
      <div className="control-grid">
        <Field label="Mode">
          <select
            value={instrument.mode}
            onChange={(event) => {
              if (event.target.value === 'fixed') {
                onChange({
                  ...config,
                  instrument: { mode: 'fixed', program: 0 }
                })
              } else {
                onChange({
                  ...config,
                  instrument: {
                    mode: 'field',
                    field: columns[3] ?? columns[0],
                    programs: [0, 24, 40]
                  }
                })
              }
            }}
          >
            <option value="fixed">Fixed</option>
            <option value="field">From column</option>
          </select>
        </Field>

        {instrument.mode === 'fixed' ? (
          <Field label="Program">
            <select
              value={instrument.program}
              onChange={(event) =>
                onChange({
                  ...config,
                  instrument: {
                    mode: 'fixed',
                    program: Number(event.target.value)
                  }
                })
              }
            >
              {INSTRUMENT_PRESETS.map((preset) => (
                <option key={preset.program} value={preset.program}>
                  {preset.name} · {preset.program}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <>
            <Field label="Column">
              <ColumnSelect
                value={instrument.field}
                columns={columns}
                onChange={(field) =>
                  onChange({
                    ...config,
                    instrument: { ...instrument, field }
                  })
                }
              />
            </Field>

            <Field label="Programs (low → high)" wide>
              <div className="checkbox-row">
                {INSTRUMENT_PRESETS.slice(0, 4).map((preset) => (
                  <label key={preset.program} className="checkbox">
                    <input
                      type="checkbox"
                      checked={instrument.programs.includes(preset.program)}
                      onChange={(event) => toggleProgram(preset.program, event.target.checked)}
                    />
                    {preset.name}
                  </label>
                ))}
              </div>
            </Field>
          </>
        )}
      </div>
    </MappingSection>
  )
}
