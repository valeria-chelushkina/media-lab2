import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { buildMidi, defaultConfig, sonify } from '@core'
import { parseCsv } from '@core/loadCsv'
async function main(): Promise<void> {
  const root = process.cwd()
  const inputPath = join(root, 'data', 'weather.csv')
  const outputDir = join(root, 'out')
  const outputPath = join(outputDir, 'weather.mid')

  const csv = await readFile(inputPath, 'utf8')
  const dataset = parseCsv(csv)
  const notes = sonify(dataset.rows, defaultConfig)
  const midi = buildMidi(notes, {
    tempo: defaultConfig.tempo,
    trackName: 'Weather sonification'
  })

  await mkdir(outputDir, { recursive: true })
  await writeFile(outputPath, midi.toArray())

  console.log(`Input:       ${inputPath}`)
  console.log(`Columns:     ${dataset.columns.join(', ')}`)
  console.log(`Rows:        ${dataset.rows.length}`)
  console.log(`Notes:       ${notes.length}`)
  console.log(`Tempo:       ${defaultConfig.tempo} BPM`)
  console.log(`Duration:    ${midi.duration.toFixed(2)} s`)
  console.log(`Mapping:     temperature -> pitch`)
  console.log(`             humidity    -> velocity`)
  console.log(`             pressure    -> duration`)
  console.log(`Written:     ${outputPath}`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
