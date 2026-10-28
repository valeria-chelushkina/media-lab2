import type { GlobalSectionProps } from '../../typedefs/mapping'
import { Field } from './Field'
import { MappingSection } from './MappingSection'
import { NumberInput } from './NumberInput'

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
