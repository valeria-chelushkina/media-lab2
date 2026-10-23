import * as Tone from 'tone'
import type { NoteEvent } from '@core/types'

interface PlaybackVoice {
  trigger: (frequency: string, duration: number, time: number, velocity: number) => void
  releaseAll: () => void
  dispose: () => void
}

export interface PlaybackHandle {
  durationSeconds: number
  stop: () => void
}

/**
 * Schedules note events on Tone.Transport and starts playback.
 * The caller is responsible for calling `stop()` when playback ends.
 */
export async function playNotes(
  notes: readonly NoteEvent[],
  tempo: number
): Promise<PlaybackHandle> {
  if (notes.length === 0) {
    throw new Error('No notes to play')
  }
  if (!Number.isFinite(tempo) || tempo <= 0) {
    throw new Error(`Invalid tempo: ${tempo}`)
  }

  await Tone.start()

  const transport = Tone.getTransport()
  transport.stop()
  transport.cancel()
  transport.bpm.value = tempo
  transport.loop = false

  const secondsPerBeat = 60 / tempo
  const voices = new Map<number, PlaybackVoice>()
  let end = 0

  for (const note of notes) {
    let voice = voices.get(note.instrument)
    if (!voice) {
      voice = createVoice(note.instrument)
      voices.set(note.instrument, voice)
    }

    const start = note.timeBeats * secondsPerBeat
    const duration = Math.max(0.03, note.durationBeats * secondsPerBeat)
    const frequency = Tone.Frequency(note.midi, 'midi').toNote()
    const target = voice

    transport.scheduleOnce((time) => {
      target.trigger(frequency, duration, time, Math.max(0.01, note.velocity / 127))
    }, start)

    end = Math.max(end, start + duration)
  }

  transport.start('+0.05')

  let stopped = false
  return {
    durationSeconds: end,
    stop: () => {
      if (stopped) return
      stopped = true
      transport.stop()
      transport.cancel()
      for (const voice of voices.values()) {
        voice.releaseAll()
        voice.dispose()
      }
      voices.clear()
    }
  }
}

/**
 * Each program gets a different synthesis engine, envelope, and effect chain
 * so the preview is more than "the same oscillator at different pitches".
 */
function createVoice(program: number): PlaybackVoice {
  switch (program) {
    case 0:
      return makeVoice(
        new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: {
            attack: 0.005,
            decay: 0.45,
            sustain: 0.04,
            release: 0.55
          }
        }),
        [makeFilter(4200)],
        -8
      )

    case 24:
      return makeVoice(
        new Tone.PolySynth(Tone.MonoSynth, {
          oscillator: { type: 'sawtooth' },
          filter: { Q: 2, type: 'lowpass', rolloff: -24 },
          envelope: {
            attack: 0.004,
            decay: 0.3,
            sustain: 0.06,
            release: 0.35
          },
          filterEnvelope: {
            attack: 0.001,
            decay: 0.2,
            sustain: 0.08,
            release: 0.3,
            baseFrequency: 220,
            octaves: 3
          }
        }),
        [],
        -10
      )

    case 40:
      return makeVoice(
        new Tone.PolySynth(Tone.FMSynth, {
          harmonicity: 2.5,
          modulationIndex: 6,
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.09,
            decay: 0.2,
            sustain: 0.65,
            release: 0.7
          },
          modulation: { type: 'sine' },
          modulationEnvelope: {
            attack: 0.25,
            decay: 0.2,
            sustain: 0.8,
            release: 0.6
          }
        }),
        [makeVibrato(5.2, 0.06, 0.35), makeReverb(1.6, 0.18)],
        -12
      )

    case 48:
      return makeVoice(
        new Tone.PolySynth(Tone.AMSynth, {
          harmonicity: 1.5,
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.35,
            decay: 0.3,
            sustain: 0.8,
            release: 1.3
          },
          modulation: { type: 'sine' },
          modulationEnvelope: {
            attack: 0.5,
            decay: 0.3,
            sustain: 0.9,
            release: 1.2
          }
        }),
        [makeChorus(2.8, 3.5, 0.25, 0.3), makeReverb(2.4, 0.28)],
        -14
      )

    case 56:
      return makeVoice(
        new Tone.PolySynth(Tone.MonoSynth, {
          oscillator: { type: 'sawtooth' },
          filter: { Q: 3, type: 'lowpass', rolloff: -12 },
          envelope: {
            attack: 0.03,
            decay: 0.18,
            sustain: 0.7,
            release: 0.3
          },
          filterEnvelope: {
            attack: 0.02,
            decay: 0.2,
            sustain: 0.55,
            release: 0.3,
            baseFrequency: 420,
            octaves: 2
          }
        }),
        [],
        -10
      )

    case 73:
      return makeVoice(
        new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.06,
            decay: 0.12,
            sustain: 0.8,
            release: 0.4
          }
        }),
        [makeVibrato(5.5, 0.05, 0.4)],
        -10
      )

    case 81:
      return makeVoice(
        new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sawtooth' },
          envelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.55,
            release: 0.3
          }
        }),
        [makeFilter(2600)],
        -12
      )

    case 88:
      return makeVoice(
        new Tone.PolySynth(Tone.AMSynth, {
          harmonicity: 1.2,
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.8,
            decay: 0.5,
            sustain: 0.8,
            release: 2
          },
          modulation: { type: 'sine' },
          modulationEnvelope: {
            attack: 0.9,
            decay: 0.4,
            sustain: 0.9,
            release: 1.8
          }
        }),
        [makeChorus(1.6, 4, 0.35, 0.35), makeReverb(3, 0.3)],
        -14
      )

    default:
      return makeVoice(
        new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.4,
            release: 0.5
          }
        }),
        [],
        -10
      )
  }
}

type PolyVoice =
  | Tone.PolySynth<Tone.Synth>
  | Tone.PolySynth<Tone.MonoSynth>
  | Tone.PolySynth<Tone.FMSynth>
  | Tone.PolySynth<Tone.AMSynth>

function makeVoice(
  synth: PolyVoice,
  effects: Tone.ToneAudioNode[] = [],
  volume = -10
): PlaybackVoice {
  synth.volume.value = volume

  if (effects.length > 0) {
    synth.chain(...effects, Tone.getDestination())
  } else {
    synth.toDestination()
  }

  return {
    trigger: (frequency, duration, time, velocity) => {
      synth.triggerAttackRelease(frequency, duration, time, velocity)
    },
    releaseAll: () => {
      synth.releaseAll()
    },
    dispose: () => {
      synth.dispose()
      effects.forEach((effect) => effect.dispose())
    }
  }
}

function makeFilter(frequency: number): Tone.Filter {
  return new Tone.Filter(frequency, 'lowpass')
}

function makeVibrato(rate: number, depth: number, wet: number): Tone.Vibrato {
  const effect = new Tone.Vibrato(rate, depth)
  effect.wet.value = wet
  return effect
}

function makeChorus(rate: number, delay: number, depth: number, wet: number): Tone.Chorus {
  const effect = new Tone.Chorus(rate, delay, depth)
  effect.wet.value = wet
  effect.start()
  return effect
}

function makeReverb(decay: number, wet: number): Tone.Reverb {
  return new Tone.Reverb({ decay, preDelay: 0.01, wet })
}
