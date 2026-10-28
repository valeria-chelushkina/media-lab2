import { Midi } from '@tonejs/midi'
import type { MidiBuildOptions, NoteEvent } from '@core/types'
// MIDI channels 0-15, excluding channel 9 (reserved for percussion)
const MELODIC_CHANNELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15]

/**
 * Builds a MIDI file from note events. Notes are grouped by instrument, so a
 *  row-by-row instrument mapping produces one track per General MIDI program.
 */
export function buildMidi(notes: readonly NoteEvent[], options: MidiBuildOptions): Midi {
  if (notes.length === 0) {
    throw new Error('Cannot build a MIDI file without notes')
  }
  if (!Number.isFinite(options.tempo) || options.tempo <= 0) {
    throw new Error(`Tempo must be a positive number, got ${options.tempo}`)
  }

  const midi = new Midi()
  midi.header.setTempo(options.tempo)

  midi.header.timeSignatures = [{ ticks: 0, timeSignature: [4, 4] }]
  midi.header.update()

  const secondsPerBeat = 60 / options.tempo
  const baseName = options.trackName ?? 'Sonification'

  const groups = new Map<number, NoteEvent[]>()
  for (const note of notes) {
    validateNote(note)
    const group = groups.get(note.instrument)
    if (group) {
      group.push(note)
    } else {
      groups.set(note.instrument, [note])
    }
  }

  let channelIndex = 0
  for (const [program, group] of groups) {
    const track = midi.addTrack()
    track.channel = MELODIC_CHANNELS[channelIndex % MELODIC_CHANNELS.length]
    channelIndex += 1
    track.instrument.number = program
    track.name = groups.size > 1 ? `${baseName} · ${track.instrument.name}` : baseName

    for (const note of group) {
      track.addNote({
        midi: note.midi,
        time: note.timeBeats * secondsPerBeat,
        duration: note.durationBeats * secondsPerBeat,
        velocity: note.velocity / 127
      })
    }
  }

  return midi
}

// serializes a Midi object into the bytes of a Standard MIDI File.
export function midiToBytes(midi: Midi): Uint8Array {
  return midi.toArray()
}

function validateNote(note: NoteEvent): void {
  if (!Number.isInteger(note.midi) || note.midi < 0 || note.midi > 127) {
    throw new Error(`Invalid MIDI note number: ${note.midi}`)
  }
  if (!Number.isFinite(note.velocity) || note.velocity < 1 || note.velocity > 127) {
    throw new Error(`Invalid MIDI velocity: ${note.velocity}`)
  }
  if (!Number.isFinite(note.timeBeats) || note.timeBeats < 0) {
    throw new Error(`Invalid note start: ${note.timeBeats}`)
  }
  if (!Number.isFinite(note.durationBeats) || note.durationBeats <= 0) {
    throw new Error(`Invalid note duration: ${note.durationBeats}`)
  }
  if (!Number.isInteger(note.instrument) || note.instrument < 0 || note.instrument > 127) {
    throw new Error(`Invalid MIDI program: ${note.instrument}`)
  }
}
