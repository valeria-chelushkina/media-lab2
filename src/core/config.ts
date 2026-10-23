import { z } from 'zod'
import { MAJOR_PENTATONIC } from './scale'

const scaleSchema = z.array(z.number().int().min(0).max(11)).min(1)

const velocitySchema = z
  .object({
    field: z.string().min(1),
    min: z.number().min(1).max(127),
    max: z.number().min(1).max(127)
  })
  .refine((value) => value.min <= value.max, {
    message: 'velocity.min must be less than or equal to velocity.max'
  })

const durationSchema = z
  .object({
    field: z.string().min(1),
    minBeats: z.number().positive(),
    maxBeats: z.number().positive()
  })
  .refine((value) => value.minBeats <= value.maxBeats, {
    message: 'duration.minBeats must be less than or equal to duration.maxBeats'
  })

export const sonificationConfigSchema = z.object({
  tempo: z.number().min(20).max(300),
  beatsPerRow: z.number().positive().max(16),
  pitch: z.object({
    field: z.string().min(1),
    rootNote: z.number().int().min(0).max(127),
    octaves: z.number().int().min(1).max(6),
    scale: scaleSchema
  }),
  velocity: velocitySchema,
  duration: durationSchema,
  instrument: z
    .object({
      field: z.string().min(1),
      programs: z.array(z.number().int().min(0).max(127)).min(1)
    })
    .optional()
})

export type SonificationConfig = z.infer<typeof sonificationConfigSchema>

/**
 * Default mapping for data/weather.csv.
 * temperature -> pitch, humidity -> velocity, pressure -> duration.
 */
export const defaultConfig: SonificationConfig = {
  tempo: 100,
  beatsPerRow: 1,
  pitch: {
    field: 'temperature',
    rootNote: 60,
    octaves: 2,
    scale: [...MAJOR_PENTATONIC]
  },
  velocity: {
    field: 'humidity',
    min: 30,
    max: 120
  },
  duration: {
    field: 'pressure',
    minBeats: 0.25,
    maxBeats: 0.9
  }
}

/**
 * Builds a starting config for an arbitrary CSV. The first three numeric
 * columns are assigned to pitch, velocity, and duration; with only two
 * columns the second one drives both velocity and duration.
 */
export function createConfigForColumns(
  columns: readonly string[],
  base: SonificationConfig = defaultConfig
): SonificationConfig {
  const names = columns.map((column) => column.trim())
  if (names.length < 2) {
    throw new Error('At least two numeric columns are required')
  }
  if (names.some((name) => name.length === 0)) {
    throw new Error('Column names must not be empty')
  }

  return {
    ...base,
    pitch: { ...base.pitch, field: names[0] },
    velocity: { ...base.velocity, field: names[1] },
    duration: { ...base.duration, field: names[2] ?? names[1] },
    instrument: undefined
  }
}
