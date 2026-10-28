import type { FieldProps } from '@renderer/typedefs/mapping.typedefs'
export function Field({ label, children, wide = false }: FieldProps): React.JSX.Element {
  return (
    <label className={wide ? 'field field-wide' : 'field'}>
      <span>{label}</span>
      {children}
    </label>
  )
}
