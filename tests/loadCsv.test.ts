import { describe, expect, it } from 'vitest'
import { parseCsv } from '../src/core/loadCsv'

describe('parseCsv', () => {
  it('parses a comma-separated numeric CSV', () => {
    const dataset = parseCsv('temperature,humidity\n12.5,65\n13.1,63\n')

    expect(dataset.columns).toEqual(['temperature', 'humidity'])
    expect(dataset.rows).toEqual([
      { temperature: 12.5, humidity: 65 },
      { temperature: 13.1, humidity: 63 }
    ])
  })

  it('handles a BOM, semicolon delimiter and decimal commas', () => {
    const dataset = parseCsv('\uFEFFtemperature;humidity\r\n12,5;65\r\n13,1;63\r\n')

    expect(dataset.rows[0]).toEqual({ temperature: 12.5, humidity: 65 })
    expect(dataset.rows[1]).toEqual({ temperature: 13.1, humidity: 63 })
  })

  it('handles quoted fields', () => {
    const dataset = parseCsv('"temperature","humidity"\n"12.5","65"\n')

    expect(dataset.rows[0]).toEqual({ temperature: 12.5, humidity: 65 })
  })

  it('trims spaces around header names', () => {
    const dataset = parseCsv('temperature, humidity\n12.5, 65\n')

    expect(dataset.columns).toEqual(['temperature', 'humidity'])
    expect(dataset.rows[0]).toEqual({ temperature: 12.5, humidity: 65 })
  })

  it('rejects a non-numeric cell', () => {
    expect(() => parseCsv('temperature,humidity\n12.5,cold\n')).toThrow(/not a finite number/)
  })

  it('rejects a dataset with fewer than two numeric columns', () => {
    expect(() => parseCsv('temperature\n12.5\n13.1\n')).toThrow(/at least two/)
  })

  it('rejects empty input and a header without rows', () => {
    expect(() => parseCsv('   ')).toThrow(/empty/)
    expect(() => parseCsv('temperature,humidity\n')).toThrow(/at least one data row/)
  })
})
