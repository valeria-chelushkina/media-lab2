import type { RangeInputProps } from '../../typedefs/mapping'
import { NumberInput } from './NumberInput'

export function RangeInput({
  minValue,
  maxValue,
  min,
  max,
  step = 1,
  onChange
}: RangeInputProps): React.JSX.Element {
  return (
    <div className="range-row">
      <NumberInput
        value={minValue}
        min={min}
        max={maxValue}
        step={step}
        onChange={(value) => onChange(value, maxValue)}
      />
      <span className="range-dash">–</span>
      <NumberInput
        value={maxValue}
        min={minValue}
        max={max}
        step={step}
        onChange={(value) => onChange(minValue, value)}
      />
    </div>
  )
}
