import type { SonificationConfig } from '@core/config'
import { MAJOR_PENTATONIC } from '@core/scale'
export interface SamplePreset {
  id: string
  name: string
  file: string
  header: boolean
  description: string
  config: SonificationConfig
}

interface PresetMapping {
  pitch: string
  velocity: string
  duration: string
  time?: string
  timeMaxBeats?: number
  instrument?: string
  programs?: number[]
  tempo?: number
}

function makeConfig(mapping: PresetMapping): SonificationConfig {
  return {
    tempo: mapping.tempo ?? 100,
    beatsPerRow: 1,
    pitch: {
      field: mapping.pitch,
      rootNote: 60,
      octaves: 2,
      scale: [...MAJOR_PENTATONIC]
    },
    velocity: { field: mapping.velocity, min: 30, max: 120 },
    duration: { field: mapping.duration, minBeats: 0.25, maxBeats: 0.9 },
    time: mapping.time
      ? {
          mode: 'field',
          field: mapping.time,
          minBeats: 0,
          maxBeats: mapping.timeMaxBeats ?? 16
        }
      : { mode: 'row' },
    instrument: mapping.instrument
      ? {
          mode: 'field',
          field: mapping.instrument,
          programs: mapping.programs ?? [0, 24, 40, 48]
        }
      : { mode: 'fixed', program: 0 }
  }
}

export const SAMPLE_PRESETS: readonly SamplePreset[] = [
  {
    id: 'weather',
    name: 'Weather',
    file: 'weather.csv',
    header: true,
    description: 'Temperature, humidity, and pressure over 16 hours.',
    config: makeConfig({
      pitch: 'temperature',
      velocity: 'humidity',
      duration: 'pressure',
      tempo: 100
    })
  },
  {
    id: 'climate',
    name: 'Climate',
    file: 'climate.csv',
    header: true,
    description: 'CO₂, temperature anomaly, and sea level, 2000–2020.',
    config: makeConfig({
      pitch: 'co2_ppm',
      velocity: 'temperature_anomaly',
      duration: 'sea_level_mm',
      time: 'year',
      timeMaxBeats: 20,
      tempo: 90
    })
  },
  {
    id: 'finance',
    name: 'Finance',
    file: 'finance.csv',
    header: true,
    description: 'Price, volume, and volatility across 24 sessions.',
    config: makeConfig({
      pitch: 'price',
      velocity: 'volume',
      duration: 'volatility',
      time: 'session',
      timeMaxBeats: 23,
      tempo: 120
    })
  },
  {
    id: 'seismic',
    name: 'Seismic',
    file: 'seismic.csv',
    header: true,
    description: 'Magnitude, depth, and distance for 20 events.',
    config: makeConfig({
      pitch: 'magnitude',
      velocity: 'depth_km',
      duration: 'distance_km',
      time: 'event',
      timeMaxBeats: 19,
      tempo: 80
    })
  },
  {
    id: 'air-quality',
    name: 'Air quality',
    file: 'air-quality.csv',
    header: true,
    description: 'Hourly PM2.5, PM10, NO₂, and temperature.',
    config: makeConfig({
      pitch: 'pm25',
      velocity: 'no2',
      duration: 'temperature',
      time: 'hour',
      timeMaxBeats: 23,
      instrument: 'pm10',
      tempo: 110
    })
  },
  {
    id: 'music-features',
    name: 'Music features',
    file: 'music-features.csv',
    header: true,
    description: 'Energy, valence, danceability, and acousticness.',
    config: makeConfig({
      pitch: 'energy',
      velocity: 'valence',
      duration: 'danceability',
      time: 'track',
      timeMaxBeats: 19,
      instrument: 'acousticness',
      tempo: 120
    })
  },
  {
    id: 'headerless',
    name: 'Headerless example',
    file: 'headerless-example.csv',
    header: false,
    description: 'Three unnamed indicators; columns are column1…column3.',
    config: makeConfig({
      pitch: 'column1',
      velocity: 'column2',
      duration: 'column3',
      tempo: 100
    })
  }
]

export function getSamplePreset(id: string): SamplePreset | undefined {
  return SAMPLE_PRESETS.find((preset) => preset.id === id)
}
