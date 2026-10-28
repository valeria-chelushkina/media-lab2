import { parse } from 'csv-parse/sync'
import type { Dataset, NumericRow } from '@core/types'
export interface CsvOptions {
  delimiter?: string
  header?: boolean
}

// parses a numeric CSV into a dataset
export function parseCsv(text: string, options: CsvOptions = {}): Dataset {
  const cleaned = text.replace(/^\uFEFF/, '').trim()
  if (cleaned.length === 0) {
    throw new Error('CSV is empty')
  }

  const delimiter = options.delimiter ?? detectDelimiter(cleaned)
  const hasHeader = options.header ?? true

  let records: string[][]
  try {
    records = parse(cleaned, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
      delimiter,
      relax_column_count: false
    }) as string[][]
  } catch (error) {
    throw new Error(`Invalid CSV: ${(error as Error).message}`, { cause: error })
  }

  if (records.length === 0) {
    throw new Error('CSV must contain at least one row')
  }

  const width = records[0].length
  if (width < 2) {
    throw new Error('CSV must contain at least two numeric columns for sonification')
  }

  let columns: string[]
  let dataRecords: string[][]

  if (hasHeader) {
    columns = records[0].map((name) => name.trim())
    validateHeader(columns)
    dataRecords = records.slice(1)

    if (dataRecords.length === 0) {
      throw new Error('CSV must contain a header and at least one data row')
    }
  } else {
    columns = Array.from({ length: width }, (_, index) => `column${index + 1}`)
    dataRecords = records
  }

  const rows = dataRecords.map((record, rowIndex) => {
    if (record.length !== columns.length) {
      throw new Error(
        `Row ${rowIndex + (hasHeader ? 2 : 1)}: expected ${columns.length} columns, got ${record.length}`
      )
    }

    const row: NumericRow = {}
    for (let index = 0; index < columns.length; index += 1) {
      const raw = record[index]
      const value = toNumber(raw)
      if (value === null) {
        throw new Error(
          `Row ${rowIndex + (hasHeader ? 2 : 1)}, column "${columns[index]}": "${raw}" is not a finite number`
        )
      }
      row[columns[index]] = value
    }
    return row
  })

  return { columns, rows }
}

function validateHeader(columns: readonly string[]): void {
  const seen = new Set<string>()

  for (const name of columns) {
    if (name.length === 0) {
      throw new Error('CSV header contains an empty column name')
    }
    if (seen.has(name)) {
      throw new Error(`CSV header contains a duplicate column name: "${name}"`)
    }
    seen.add(name)
  }
}

function detectDelimiter(text: string): string {
  const header = text.split(/\r?\n/, 1)[0]
  const candidates = [',', ';', '\t']
  let best = ','
  let bestCount = -1

  for (const candidate of candidates) {
    const count = header.split(candidate).length - 1
    if (count > bestCount) {
      best = candidate
      bestCount = count
    }
  }

  return best
}

function toNumber(raw: string): number | null {
  let candidate = raw.trim().replace(/\s+/g, '')
  if (candidate.length === 0) return null

  if (candidate.includes(',') && !candidate.includes('.')) {
    candidate = candidate.replace(',', '.')
  } else if (candidate.includes(',') && candidate.includes('.')) {
    candidate = candidate.replace(/,/g, '')
  }

  if (!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/.test(candidate)) {
    return null
  }

  const value = Number(candidate)
  return Number.isFinite(value) ? value : null
}
