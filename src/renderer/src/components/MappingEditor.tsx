import { useState, type ReactNode } from 'react'
import type { SonificationConfig } from '@core/config'
import { INSTRUMENT_PRESETS } from '@core/instruments'
import { SCALE_PRESETS } from '@core/scale'
import { ROOT_NOTE_OPTIONS } from '../lib/midi'

interface MappingEditorProps {
  columns: string[]
  config: SonificationConfig
  onChange: (config: SonificationConfig) => void
}

export function MappingEditor({
  columns,
  config,
  onChange
}: MappingEditorProps): React.JSX.Element {
  const time = config.time ?? { mode: 'row' as const }
  const instrument = config.instrument ?? { mode: 'fixed' as const, program: 0 }

  const scalePreset =
    SCALE_PRESETS.find(
      (preset) =>
        preset.degrees.length === config.pitch.scale.length &&
        preset.degrees.every((degree, index) => degree === config.pitch.scale[index])
    ) ?? SCALE_PRESETS[0]

  function patch(next: Partial<SonificationConfig>): void {
    onChange({ ...config, ...next })
  }

  function toggleProgram(program: number, checked: boolean): void {
    if (instrument.mode !== 'field') return

    const programs = checked
      ? Array.from(new Set([...instrument.programs, program])).sort((left, right) => left - right)
      : instrument.programs.filter((value) => value !== program)

    if (programs.length === 0) return
    patch({ instrument: { ...instrument, programs } })
  }

  return (
    <div className="mapping-editor">
      <section className="mapping-block">
        <h3>Pitch</h3>
        <div className="control-grid">
          <Field label="Column">
            <ColumnSelect
              value={config.pitch.field}
              columns={columns}
              onChange={(field) => patch({ pitch: { ...config.pitch, field } })}
            />
          </Field>

          <Field label="Root note">
            <select
              value={config.pitch.rootNote}
              onChange={(event) =>
                patch({
                  pitch: {
                    ...config.pitch,
                    rootNote: Number(event.target.value)
                  }
                })
              }
            >
              {ROOT_NOTE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Octaves">
            <NumberInput
              value={config.pitch.octaves}
              min={1}
              max={5}
              integer
              onChange={(octaves) => patch({ pitch: { ...config.pitch, octaves } })}
            />
          </Field>

          <Field label="Scale">
            <select
              value={scalePreset.name}
              onChange={(event) => {
                const preset = SCALE_PRESETS.find((entry) => entry.name === event.target.value)
                if (preset) {
                  patch({
                    pitch: { ...config.pitch, scale: [...preset.degrees] }
                  })
                }
              }}
            >
              {SCALE_PRESETS.map((preset) => (
                <option key={preset.name} value={preset.name}>
                  {preset.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="mapping-block">
        <h3>Velocity</h3>
        <div className="control-grid">
          <Field label="Column">
            <ColumnSelect
              value={config.velocity.field}
              columns={columns}
              onChange={(field) => patch({ velocity: { ...config.velocity, field } })}
            />
          </Field>

          <Field label="Range (1–127)" wide>
            <RangeInput
              minValue={config.velocity.min}
              maxValue={config.velocity.max}
              min={1}
              max={127}
              onChange={(min, max) => patch({ velocity: { ...config.velocity, min, max } })}
            />
          </Field>
        </div>
      </section>

      <section className="mapping-block">
        <h3>Duration</h3>
        <div className="control-grid">
          <Field label="Column">
            <ColumnSelect
              value={config.duration.field}
              columns={columns}
              onChange={(field) => patch({ duration: { ...config.duration, field } })}
            />
          </Field>

          <Field label="Range (beats)" wide>
            <RangeInput
              minValue={config.duration.minBeats}
              maxValue={config.duration.maxBeats}
              min={0.05}
              max={16}
              step={0.05}
              onChange={(minBeats, maxBeats) =>
                patch({
                  duration: { ...config.duration, minBeats, maxBeats }
                })
              }
            />
          </Field>
        </div>
      </section>

      <section className="mapping-block">
        <h3>Time</h3>
        <div className="control-grid">
          <Field label="Mode">
            <select
              value={time.mode}
              onChange={(event) => {
                if (event.target.value === 'row') {
                  patch({ time: { mode: 'row' } })
                } else {
                  patch({
                    time: {
                      mode: 'field',
                      field: columns[3] ?? columns[0],
                      minBeats: 0,
                      maxBeats: 16
                    }
                  })
                }
              }}
            >
              <option value="row">Row grid</option>
              <option value="field">From column</option>
            </select>
          </Field>

          {time.mode === 'row' ? (
            <Field label="Beats per row">
              <NumberInput
                value={config.beatsPerRow}
                min={0.1}
                max={16}
                step={0.1}
                onChange={(beatsPerRow) => patch({ beatsPerRow })}
              />
            </Field>
          ) : (
            <>
              <Field label="Column">
                <ColumnSelect
                  value={time.field}
                  columns={columns}
                  onChange={(field) => patch({ time: { ...time, field } })}
                />
              </Field>

              <Field label="Range (beats)" wide>
                <RangeInput
                  minValue={time.minBeats}
                  maxValue={time.maxBeats}
                  min={0}
                  max={128}
                  step={0.5}
                  onChange={(minBeats, maxBeats) =>
                    patch({ time: { ...time, minBeats, maxBeats } })
                  }
                />
              </Field>
            </>
          )}
        </div>
      </section>

      <section className="mapping-block">
        <h3>Instrument</h3>
        <div className="control-grid">
          <Field label="Mode">
            <select
              value={instrument.mode}
              onChange={(event) => {
                if (event.target.value === 'fixed') {
                  patch({ instrument: { mode: 'fixed', program: 0 } })
                } else {
                  patch({
                    instrument: {
                      mode: 'field',
                      field: columns[3] ?? columns[0],
                      programs: [0, 24, 40]
                    }
                  })
                }
              }}
            >
              <option value="fixed">Fixed</option>
              <option value="field">From column</option>
            </select>
          </Field>

          {instrument.mode === 'fixed' ? (
            <Field label="Program">
              <select
                value={instrument.program}
                onChange={(event) =>
                  patch({
                    instrument: {
                      mode: 'fixed',
                      program: Number(event.target.value)
                    }
                  })
                }
              >
                {INSTRUMENT_PRESETS.map((preset) => (
                  <option key={preset.program} value={preset.program}>
                    {preset.name} · {preset.program}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <>
              <Field label="Column">
                <ColumnSelect
                  value={instrument.field}
                  columns={columns}
                  onChange={(field) => patch({ instrument: { ...instrument, field } })}
                />
              </Field>

              <Field label="Programs (low → high)" wide>
                <div className="checkbox-row">
                  {INSTRUMENT_PRESETS.slice(0, 4).map((preset) => (
                    <label key={preset.program} className="checkbox">
                      <input
                        type="checkbox"
                        checked={instrument.programs.includes(preset.program)}
                        onChange={(event) => toggleProgram(preset.program, event.target.checked)}
                      />
                      {preset.name}
                    </label>
                  ))}
                </div>
              </Field>
            </>
          )}
        </div>
      </section>

      <section className="mapping-block">
        <h3>Global</h3>
        <div className="control-grid">
          <Field label="Tempo (BPM)">
            <NumberInput
              value={config.tempo}
              min={20}
              max={300}
              onChange={(tempo) => patch({ tempo })}
            />
          </Field>
        </div>
      </section>
    </div>
  )
}

interface FieldProps {
  label: string
  children: ReactNode
  wide?: boolean
}

function Field({ label, children, wide = false }: FieldProps): React.JSX.Element {
  return (
    <label className={wide ? 'field field-wide' : 'field'}>
      <span>{label}</span>
      {children}
    </label>
  )
}

interface ColumnSelectProps {
  value: string
  columns: string[]
  onChange: (value: string) => void
}

function ColumnSelect({ value, columns, onChange }: ColumnSelectProps): React.JSX.Element {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {columns.map((column) => (
        <option key={column} value={column}>
          {column}
        </option>
      ))}
    </select>
  )
}

interface NumberInputProps {
  value: number
  min: number
  max: number
  step?: number
  integer?: boolean
  onChange: (value: number) => void
}

function NumberInput({
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

interface RangeInputProps {
  minValue: number
  maxValue: number
  min: number
  max: number
  step?: number
  onChange: (min: number, max: number) => void
}

function RangeInput({
  minValue,
  maxValue,
  min,
  max,
  step = 1,
  onChange
}: RangeInputProps): React.JSX.Element {
  return (
    <div className="range-row">
      <NumberInput
        value={minValue}
        min={min}
        max={maxValue}
        step={step}
        onChange={(value) => onChange(value, maxValue)}
      />
      <span className="range-dash">–</span>
      <NumberInput
        value={maxValue}
        min={minValue}
        max={max}
        step={step}
        onChange={(value) => onChange(minValue, value)}
      />
    </div>
  )
}
