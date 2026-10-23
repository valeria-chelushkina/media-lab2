export interface InstrumentPreset {
  program: number
  name: string
}

export const INSTRUMENT_PRESETS: readonly InstrumentPreset[] = [
  { program: 0, name: 'Piano' },
  { program: 24, name: 'Guitar' },
  { program: 40, name: 'Violin' },
  { program: 48, name: 'Strings' },
  { program: 56, name: 'Trumpet' },
  { program: 73, name: 'Flute' },
  { program: 81, name: 'Saw lead' },
  { program: 88, name: 'Warm pad' }
]

export function instrumentName(program: number): string {
  return (
    INSTRUMENT_PRESETS.find((preset) => preset.program === program)?.name ?? `Program ${program}`
  )
}
