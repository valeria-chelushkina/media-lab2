import type { ColumnSelectProps } from '../../typedefs/mapping'

export function ColumnSelect({ value, columns, onChange }: ColumnSelectProps): React.JSX.Element {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {columns.map((column) => (
        <option key={column} value={column}>
          {column}
        </option>
      ))}
    </select>
  )
}
