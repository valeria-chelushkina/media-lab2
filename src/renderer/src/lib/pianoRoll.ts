import type { NoteEvent } from '@core/types'
import { midiName } from '@renderer/lib/midi'
import type {
  PianoRollGeometry,
  BeatLine,
  OctaveLine,
  NoteRect
} from '@renderer/typedefs/pianoRoll.typedefs'

export const PIANO_ROLL_HEIGHT = 240
export const PIANO_ROLL_PADDING = {
  left: 42,
  right: 14,
  top: 12,
  bottom: 24
} as const

const COLORS = [
  '#a96b7e',
  '#62886f',
  '#a8824f',
  '#806f9e',
  '#a86a6a',
  '#5b8794',
  '#96709f',
  '#6b8f70'
]

export function buildPianoRollGeometry(
  notes: readonly NoteEvent[],
  width: number
): PianoRollGeometry {
  const totalBeats = Math.max(1, ...notes.map((note) => note.timeBeats + note.durationBeats))
  const minNote = Math.max(0, Math.min(...notes.map((note) => note.midi)) - 1)
  const maxNote = Math.min(127, Math.max(...notes.map((note) => note.midi)) + 1)
  const rows = Math.max(1, maxNote - minNote + 1)

  const plotWidth = Math.max(1, width - PIANO_ROLL_PADDING.left - PIANO_ROLL_PADDING.right)
  const plotHeight = PIANO_ROLL_HEIGHT - PIANO_ROLL_PADDING.top - PIANO_ROLL_PADDING.bottom
  const rowHeight = plotHeight / rows

  const xForBeat = (beat: number): number =>
    PIANO_ROLL_PADDING.left + (beat / totalBeats) * plotWidth
  const yForNote = (midi: number): number => PIANO_ROLL_PADDING.top + (maxNote - midi) * rowHeight

  const programs = Array.from(new Set(notes.map((note) => note.instrument))).sort(
    (left, right) => left - right
  )
  const colorByProgram = new Map(
    programs.map((program, index) => [program, COLORS[index % COLORS.length]])
  )

  const beatStep = totalBeats <= 16 ? 1 : totalBeats <= 32 ? 2 : 4
  const labelEvery = beatStep * 4
  const beatLines: BeatLine[] = []
  for (let beat = 0; beat <= totalBeats; beat += beatStep) {
    beatLines.push({
      beat,
      x: xForBeat(beat),
      label: beat % labelEvery === 0 ? String(beat) : null
    })
  }

  const octaveLines: OctaveLine[] = []
  for (let midi = Math.ceil(minNote / 12) * 12; midi <= maxNote; midi += 12) {
    octaveLines.push({
      midi,
      y: yForNote(midi),
      label: `C${Math.floor(midi / 12) - 1}`
    })
  }

  const noteRects: NoteRect[] = notes.map((note, index) => {
    const x = xForBeat(note.timeBeats)
    const noteWidth = Math.max(2, xForBeat(note.timeBeats + note.durationBeats) - x)
    const rowY = yForNote(note.midi)

    return {
      key: `${index}-${note.timeBeats}-${note.midi}`,
      x,
      y: rowY + Math.max(1, rowHeight * 0.12),
      width: noteWidth,
      height: Math.max(3, rowHeight * 0.76),
      color: colorByProgram.get(note.instrument) ?? COLORS[0],
      opacity: 0.72 + 0.28 * (note.velocity / 127),
      label: `${midiName(note.midi)} · velocity ${note.velocity} · ${note.durationBeats.toFixed(2)} beats`
    }
  })

  return {
    plotWidth,
    plotHeight,
    beatLines,
    octaveLines,
    noteRects,
    programs,
    colorByProgram
  }
}
