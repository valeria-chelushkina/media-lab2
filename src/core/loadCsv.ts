import { parse } from 'csv-parse/sync'
import type { Dataset, NumericRow } from './types'

export interface CsvOptions {
  /**
   * Field delimiter. When omitted it is detected from the header line,
   * which handles both comma CSV and semicolon CSV exported by Excel.
   */
  delimiter?: string
}

/**
 * Parses a numeric CSV into a dataset. The first row must contain unique
 * column names; every subsequent row must contain a finite number in every
 * column.
 */
export function parseCsv(text: string, options: CsvOptions = {}): Dataset {
  const cleaned = text.replace(/^\uFEFF/, '').trim()
  if (cleaned.length === 0) {
    throw new Error('CSV is empty')
  }

  const delimiter = options.delimiter ?? detectDelimiter(cleaned)

  let records: Record<string, string>[]
  try {
    records = parse(cleaned, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter,
      relax_column_count: false
    }) as Record<string, string>[]
  } catch (error) {
    throw new Error(`Invalid CSV: ${(error as Error).message}`, { cause: error })
  }

  if (records.length === 0) {
    throw new Error('CSV must contain a header and at least one data row')
  }

  const columns = Object.keys(records[0])
  if (columns.length < 2) {
    throw new Error('CSV must contain at least two numeric columns for sonification')
  }

  const rows = records.map((record, rowIndex) => {
    const row: NumericRow = {}
    for (const column of columns) {
      const raw = record[column]
      if (raw === undefined) {
        throw new Error(`Row ${rowIndex + 2}: missing column "${column}"`)
      }
      const value = toNumber(raw)
      if (value === null) {
        throw new Error(`Row ${rowIndex + 2}, column "${column}": "${raw}" is not a finite number`)
      }
      row[column] = value
    }
    return row
  })

  return { columns, rows }
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
