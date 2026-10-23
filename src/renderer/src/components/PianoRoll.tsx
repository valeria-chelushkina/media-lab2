import { useEffect, useMemo, useRef, useState } from 'react'
import { instrumentName } from '@core/instruments'
import type { NoteEvent } from '@core/types'
import { midiName } from '../lib/midi'

const HEIGHT = 240
const PADDING = { left: 42, right: 14, top: 12, bottom: 24 }
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

interface PianoRollProps {
  notes: readonly NoteEvent[]
  progress: number
}

export function PianoRoll({ notes, progress }: PianoRollProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1000)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width
      if (next && next > 0) setWidth(next)
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const geometry = useMemo(() => buildGeometry(notes, width), [notes, width])

  if (notes.length === 0) {
    return (
      <div className="piano-roll" ref={containerRef}>
        <p className="piano-roll-empty">No notes to display.</p>
      </div>
    )
  }

  const playheadX = PADDING.left + Math.min(1, Math.max(0, progress)) * geometry.plotWidth

  return (
    <div className="piano-roll" ref={containerRef}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`Piano roll with ${notes.length} notes`}
      >
        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={geometry.plotWidth}
          height={geometry.plotHeight}
          rx={6}
          fill="rgba(253, 252, 252, 0.8)"
        />

        {geometry.beatLines.map((line) => (
          <g key={`beat-${line.beat}`}>
            <line
              x1={line.x}
              x2={line.x}
              y1={PADDING.top}
              y2={PADDING.top + geometry.plotHeight}
              stroke="rgba(60, 55, 55, 0.08)"
            />
            {line.label !== null ? (
              <text x={line.x} y={HEIGHT - 7} fill="#746b6d" fontSize={9} textAnchor="middle">
                {line.label}
              </text>
            ) : null}
          </g>
        ))}

        {geometry.octaveLines.map((line) => (
          <g key={`octave-${line.midi}`}>
            <line
              x1={PADDING.left}
              x2={PADDING.left + geometry.plotWidth}
              y1={line.y}
              y2={line.y}
              stroke="rgba(60, 55, 55, 0.14)"
            />
            <text x={PADDING.left - 7} y={line.y + 3} fill="#746b6d" fontSize={9} textAnchor="end">
              {line.label}
            </text>
          </g>
        ))}

        {geometry.noteRects.map((note) => (
          <rect
            key={note.key}
            x={note.x}
            y={note.y}
            width={note.width}
            height={note.height}
            rx={2}
            fill={note.color}
            opacity={note.opacity}
          >
            <title>{note.label}</title>
          </rect>
        ))}

        {progress > 0 ? (
          <line
            x1={playheadX}
            x2={playheadX}
            y1={PADDING.top}
            y2={PADDING.top + geometry.plotHeight}
            stroke="#96596d"
            strokeWidth={2}
          />
        ) : null}
      </svg>

      <div className="piano-roll-legend">
        {geometry.programs.map((program) => (
          <span key={program} className="legend-item">
            <span
              className="legend-swatch"
              style={{ background: geometry.colorByProgram.get(program) }}
            />
            {instrumentName(program)}
          </span>
        ))}
      </div>
    </div>
  )
}

interface NoteRect {
  key: string
  x: number
  y: number
  width: number
  height: number
  color: string
  opacity: number
  label: string
}

interface BeatLine {
  beat: number
  x: number
  label: string | null
}

interface OctaveLine {
  midi: number
  y: number
  label: string
}

interface Geometry {
  plotWidth: number
  plotHeight: number
  beatLines: BeatLine[]
  octaveLines: OctaveLine[]
  noteRects: NoteRect[]
  programs: number[]
  colorByProgram: Map<number, string>
}

function buildGeometry(notes: readonly NoteEvent[], width: number): Geometry {
  const totalBeats = Math.max(1, ...notes.map((note) => note.timeBeats + note.durationBeats))
  const minNote = Math.max(0, Math.min(...notes.map((note) => note.midi)) - 1)
  const maxNote = Math.min(127, Math.max(...notes.map((note) => note.midi)) + 1)
  const rows = Math.max(1, maxNote - minNote + 1)

  const plotWidth = Math.max(1, width - PADDING.left - PADDING.right)
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom
  const rowHeight = plotHeight / rows

  const xForBeat = (beat: number): number => PADDING.left + (beat / totalBeats) * plotWidth
  const yForNote = (midi: number): number => PADDING.top + (maxNote - midi) * rowHeight

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
