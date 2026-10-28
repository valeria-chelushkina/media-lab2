import type { GlobalSectionProps } from '@renderer/typedefs/mapping.typedefs'
import { Field } from '@renderer/components/mapping/Field'
import { MappingSection } from '@renderer/components/mapping/MappingSection'
import { NumberInput } from '@renderer/components/mapping/NumberInput'
export function GlobalSection({ config, onChange }: GlobalSectionProps): React.JSX.Element {
  return (
    <MappingSection title="Global">
      <div className="control-grid">
        <Field label="Tempo (BPM)">
          <NumberInput
            value={config.tempo}
            min={20}
            max={300}
            onChange={(tempo) => onChange({ ...config, tempo })}
          />
        </Field>
      </div>
    </MappingSection>
  )
}
