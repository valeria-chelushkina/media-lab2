import type { NoteEvent } from '@core/types'

export interface PianoRollProps {
  notes: readonly NoteEvent[]
  progress: number
}

export interface NoteRect {
  key: string
  x: number
  y: number
  width: number
  height: number
  color: string
  opacity: number
  label: string
}

export interface BeatLine {
  beat: number
  x: number
  label: string | null
}

export interface OctaveLine {
  midi: number
  y: number
  label: string
}

export interface PianoRollGeometry {
  plotWidth: number
  plotHeight: number
  beatLines: BeatLine[]
  octaveLines: OctaveLine[]
  noteRects: NoteRect[]
  programs: number[]
  colorByProgram: Map<number, string>
}
