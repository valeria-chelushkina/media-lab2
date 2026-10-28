import { SCALE_PRESETS } from '@core/scale'
import type { MappingSectionProps } from '@renderer/typedefs/mapping.typedefs'
import { ROOT_NOTE_OPTIONS } from '@renderer/lib/midi'
import { ColumnSelect } from '@renderer/components/mapping/ColumnSelect'
import { Field } from '@renderer/components/mapping/Field'
import { MappingSection } from '@renderer/components/mapping/MappingSection'
import { NumberInput } from '@renderer/components/mapping/NumberInput'
export function PitchSection({
  columns,
  config,
  onChange
}: MappingSectionProps): React.JSX.Element {
  const scalePreset =
    SCALE_PRESETS.find(
      (preset) =>
        preset.degrees.length === config.pitch.scale.length &&
        preset.degrees.every((degree, index) => degree === config.pitch.scale[index])
    ) ?? SCALE_PRESETS[0]

  return (
    <MappingSection title="Pitch">
      <div className="control-grid">
        <Field label="Column">
          <ColumnSelect
            value={config.pitch.field}
            columns={columns}
            onChange={(field) => onChange({ ...config, pitch: { ...config.pitch, field } })}
          />
        </Field>

        <Field label="Root note">
          <select
            value={config.pitch.rootNote}
            onChange={(event) =>
              onChange({
                ...config,
                pitch: {
                  ...config.pitch,
                  rootNote: Number(event.target.value)
                }
              })
            }
          >
            {ROOT_NOTE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Octaves">
          <NumberInput
            value={config.pitch.octaves}
            min={1}
            max={5}
            integer
            onChange={(octaves) =>
              onChange({
                ...config,
                pitch: { ...config.pitch, octaves }
              })
            }
          />
        </Field>

        <Field label="Scale">
          <select
            value={scalePreset.name}
            onChange={(event) => {
              const preset = SCALE_PRESETS.find((entry) => entry.name === event.target.value)
              if (preset) {
                onChange({
                  ...config,
                  pitch: { ...config.pitch, scale: [...preset.degrees] }
                })
              }
            }}
          >
            {SCALE_PRESETS.map((preset) => (
              <option key={preset.name} value={preset.name}>
                {preset.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </MappingSection>
  )
}
