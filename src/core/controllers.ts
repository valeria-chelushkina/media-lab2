export interface ControllerPreset {
  number: number
  name: string
}

/** Common MIDI continuous controllers exposed by the mapping editor. */
export const CONTROLLER_PRESETS: readonly ControllerPreset[] = [
  { number: 1, name: 'Modulation' },
  { number: 10, name: 'Pan' },
  { number: 11, name: 'Expression' },
  { number: 74, name: 'Brightness' },
  { number: 91, name: 'Reverb' }
]

export function controllerName(number: number): string {
  return CONTROLLER_PRESETS.find((preset) => preset.number === number)?.name ?? `CC ${number}`
}
