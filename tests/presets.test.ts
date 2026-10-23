import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildMidi } from '../src/core/buildMidi'
import { unmappedFields } from '../src/core/config'
import { parseCsv } from '../src/core/loadCsv'
import { getSamplePreset, SAMPLE_PRESETS } from '../src/core/presets'
import { sonify } from '../src/core/sonify'

const dataDirectory = join(process.cwd(), 'data')

describe('sample presets', () => {
  it('has unique ids and a resolvable lookup', () => {
    const ids = new Set(SAMPLE_PRESETS.map((preset) => preset.id))

    expect(ids.size).toBe(SAMPLE_PRESETS.length)
    expect(getSamplePreset('climate')?.name).toBe('Climate')
    expect(getSamplePreset('missing')).toBeUndefined()
  })

  it('parses every preset and uses every input column', async () => {
    for (const preset of SAMPLE_PRESETS) {
      const text = await readFile(join(dataDirectory, preset.file), 'utf8')
      const dataset = parseCsv(text, { header: preset.header })

      expect(dataset.columns.length, preset.id).toBeGreaterThanOrEqual(2)
      expect(dataset.rows.length, preset.id).toBeGreaterThan(0)
      expect(unmappedFields(dataset.columns, preset.config), preset.id).toEqual([])

      const notes = sonify(dataset.rows, preset.config)
      const midi = buildMidi(notes, { tempo: preset.config.tempo })

      expect(notes.length, preset.id).toBe(dataset.rows.length)
      expect(midi.tracks.length, preset.id).toBeGreaterThan(0)
    }
  })

  it('loads the headerless preset without a header row', async () => {
    const preset = getSamplePreset('headerless')
    expect(preset).toBeDefined()

    const text = await readFile(join(dataDirectory, preset!.file), 'utf8')
    const dataset = parseCsv(text, { header: preset!.header })

    expect(dataset.columns).toEqual(['column1', 'column2', 'column3'])
    expect(dataset.rows[0]).toEqual({
      column1: 12,
      column2: 78,
      column3: 1014
    })
  })
})
