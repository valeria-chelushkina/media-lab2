import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildMidi } from '../src/core/buildMidi'
import { createConfigForColumns } from '../src/core/config'
import { parseCsv } from '../src/core/loadCsv'
import { sonify } from '../src/core/sonify'

const dataDirectory = join(process.cwd(), 'data')

describe('bundled sample datasets', () => {
  it('parses every CSV in data/', async () => {
    const files = (await readdir(dataDirectory)).filter((file) =>
      file.toLowerCase().endsWith('.csv')
    )

    expect(files.length).toBeGreaterThanOrEqual(6)

    for (const file of files) {
      const text = await readFile(join(dataDirectory, file), 'utf8')
      const dataset = parseCsv(text, file === 'headerless-example.csv' ? { header: false } : {})

      expect(dataset.columns.length, file).toBeGreaterThanOrEqual(2)
      expect(dataset.rows.length, file).toBeGreaterThan(0)

      for (const row of dataset.rows) {
        for (const column of dataset.columns) {
          expect(Number.isFinite(row[column]), `${file}:${column}`).toBe(true)
        }
      }

      const config = createConfigForColumns(dataset.columns)
      const notes = sonify(dataset.rows, config)
      const midi = buildMidi(notes, { tempo: config.tempo })

      expect(notes.length, file).toBe(dataset.rows.length)
      expect(midi.tracks.length, file).toBeGreaterThan(0)
    }
  })
})
