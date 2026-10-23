import { describe, expect, it } from 'vitest'
import { createConfigForColumns, defaultConfig } from '../src/core/config'

describe('createConfigForColumns', () => {
  it('maps the first three columns to pitch, velocity and duration', () => {
    const config = createConfigForColumns(['open', 'high', 'low'])

    expect(config.pitch.field).toBe('open')
    expect(config.velocity.field).toBe('high')
    expect(config.duration.field).toBe('low')
    expect(config.instrument).toEqual({ mode: 'fixed', program: 0 })
    expect(config.time).toEqual({ mode: 'row' })
    expect(config.controllers).toEqual([])
  })

  it('uses the second column for duration when only two columns exist', () => {
    const config = createConfigForColumns(['x', 'y'])

    expect(config.pitch.field).toBe('x')
    expect(config.velocity.field).toBe('y')
    expect(config.duration.field).toBe('y')
  })

  it('trims whitespace around column names', () => {
    const config = createConfigForColumns([' temperature ', 'humidity'])

    expect(config.pitch.field).toBe('temperature')
  })

  it('preserves the base musical settings', () => {
    const config = createConfigForColumns(['a', 'b'])

    expect(config.tempo).toBe(defaultConfig.tempo)
    expect(config.pitch.scale).toEqual(defaultConfig.pitch.scale)
    expect(config.velocity.min).toBe(defaultConfig.velocity.min)
  })

  it('rejects fewer than two columns', () => {
    expect(() => createConfigForColumns(['only'])).toThrow(/At least two/)
  })
})
