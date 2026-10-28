import { useState } from 'react'
import type { NumberInputProps } from '../../typedefs/mapping'

export function NumberInput({
  value,
  min,
  max,
  step = 1,
  integer = false,
  onChange
}: NumberInputProps): React.JSX.Element {
  const [draft, setDraft] = useState<string | null>(null)
  const display = draft ?? String(value)

  function normalize(input: string): number | null {
    const parsed = Number(input)
    if (!Number.isFinite(parsed)) return null
    const clamped = Math.min(max, Math.max(min, parsed))
    return integer ? Math.round(clamped) : clamped
  }

  function commit(input: string): void {
    if (input.trim() === '') {
      setDraft(null)
      return
    }

    const next = normalize(input)
    setDraft(null)
    if (next !== null && next !== value) onChange(next)
  }

  return (
    <input
      type="number"
      value={display}
      min={min}
      max={max}
      step={step}
      onFocus={() => setDraft(String(value))}
      onChange={(event) => {
        const raw = event.target.value
        setDraft(raw)
        if (raw === '' || raw === '-' || raw.endsWith('.')) return
        const next = normalize(raw)
        if (next !== null && next !== value) onChange(next)
      }}
      onBlur={(event) => commit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          commit(event.currentTarget.value)
          event.currentTarget.blur()
        }
      }}
    />
  )
}
