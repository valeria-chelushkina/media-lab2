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

  it('treats every row as data when header is false', () => {
    const dataset = parseCsv('12,78\n13,80\n14,82\n', { header: false })

    expect(dataset.columns).toEqual(['column1', 'column2'])
    expect(dataset.rows).toEqual([
      { column1: 12, column2: 78 },
      { column1: 13, column2: 80 },
      { column1: 14, column2: 82 }
    ])
  })

  it('accepts a single headerless data row', () => {
    const dataset = parseCsv('12,78,1014\n', { header: false })

    expect(dataset.columns).toEqual(['column1', 'column2', 'column3'])
    expect(dataset.rows).toEqual([{ column1: 12, column2: 78, column3: 1014 }])
  })

  it('rejects duplicate header names', () => {
    expect(() => parseCsv('a,a,b\n1,2,3\n')).toThrow(/duplicate column name/)
  })

  it('rejects empty header names', () => {
    expect(() => parseCsv('a,,c\n1,2,3\n')).toThrow(/empty column name/)
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
