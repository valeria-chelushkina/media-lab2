const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// MIDI 60 -> "C4" (scientific pitch notation).
export function midiName(note: number): string {
  const name = NOTE_NAMES[((note % 12) + 12) % 12]
  const octave = Math.floor(note / 12) - 1
  return `${name}${octave}`
}

// root-note choices from C3 (48) to C6 (84).
export const ROOT_NOTE_OPTIONS = Array.from({ length: 37 }, (_, index) => {
  const value = 48 + index
  return { value, label: `${midiName(value)} · ${value}` }
})
