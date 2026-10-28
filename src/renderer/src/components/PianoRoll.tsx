import { useEffect, useMemo, useRef, useState } from 'react'
import { instrumentName } from '@core/instruments'
import {
  buildPianoRollGeometry,
  PIANO_ROLL_HEIGHT,
  PIANO_ROLL_PADDING
} from '@renderer/lib/pianoRoll'
import type { PianoRollProps } from '@renderer/typedefs/pianoRoll.typedefs'
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

  const geometry = useMemo(() => buildPianoRollGeometry(notes, width), [notes, width])

  if (notes.length === 0) {
    return (
      <div className="piano-roll" ref={containerRef}>
        <p className="piano-roll-empty">No notes to display.</p>
      </div>
    )
  }

  const playheadX =
    PIANO_ROLL_PADDING.left + Math.min(1, Math.max(0, progress)) * geometry.plotWidth

  return (
    <div className="piano-roll" ref={containerRef}>
      <svg
        width={width}
        height={PIANO_ROLL_HEIGHT}
        role="img"
        aria-label={`Piano roll with ${notes.length} notes`}
      >
        <rect
          x={PIANO_ROLL_PADDING.left}
          y={PIANO_ROLL_PADDING.top}
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
              y1={PIANO_ROLL_PADDING.top}
              y2={PIANO_ROLL_PADDING.top + geometry.plotHeight}
              stroke="rgba(60, 55, 55, 0.08)"
            />
            {line.label !== null ? (
              <text
                x={line.x}
                y={PIANO_ROLL_HEIGHT - 7}
                fill="#746b6d"
                fontSize={9}
                textAnchor="middle"
              >
                {line.label}
              </text>
            ) : null}
          </g>
        ))}

        {geometry.octaveLines.map((line) => (
          <g key={`octave-${line.midi}`}>
            <line
              x1={PIANO_ROLL_PADDING.left}
              x2={PIANO_ROLL_PADDING.left + geometry.plotWidth}
              y1={line.y}
              y2={line.y}
              stroke="rgba(60, 55, 55, 0.14)"
            />
            <text
              x={PIANO_ROLL_PADDING.left - 7}
              y={line.y + 3}
              fill="#746b6d"
              fontSize={9}
              textAnchor="end"
            >
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
            y1={PIANO_ROLL_PADDING.top}
            y2={PIANO_ROLL_PADDING.top + geometry.plotHeight}
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
