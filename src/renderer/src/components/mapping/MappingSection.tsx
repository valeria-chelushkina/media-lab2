import type { MappingSectionWrapperProps } from '../../typedefs/mapping'

export function MappingSection({ title, children }: MappingSectionWrapperProps): React.JSX.Element {
  return (
    <section className="mapping-block">
      <h3>{title}</h3>
      {children}
    </section>
  )
}
