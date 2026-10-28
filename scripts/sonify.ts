import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { buildMidi } from '@core/buildMidi'
import {
  createConfigForColumns,
  sonificationConfigSchema,
  unmappedFields,
  type SonificationConfig
} from '@core/config'
import { parseCsv } from '@core/loadCsv'
import { getSamplePreset, SAMPLE_PRESETS } from '@core/presets'
import { sonify } from '@core/sonify'

interface CliArgs {
  input?: string
  out?: string
  config?: string
  preset?: string
  headerless?: boolean
  tempo?: string
  'list-presets'?: boolean
  help?: boolean
}

function printUsage(): void {
  console.log(`Data Sonifier CLI

Usage:
  npm run sonify -- --input data/climate.csv --out out/climate.mid
  npm run sonify -- --preset music-features --out out/music.mid
  npm run sonify -- --preset climate --config my-mapping.json
  npm run sonify -- --input data/my-data.csv --headerless

Options:
  -i, --input <file>    Input CSV. Required unless --preset is used.
  -o, --out <file>      Output .mid. Defaults to out/<input-name>.mid.
  -p, --preset <id>     Bundled sample preset (see --list-presets).
  -c, --config <file>   JSON mapping config, validated with zod.
      --headerless      Treat every row as data (no header row).
  -t, --tempo <bpm>     Override the config tempo.
      --list-presets    Print available sample presets.
  -h, --help            Show this help.

Examples:
  npm run sonify -- --input data/climate.csv --out out/climate.mid
  npm run sonify -- --preset music-features
  npm run sonify -- --preset headerless
`)
}

function printPresets(): void {
  console.log('Available sample presets:\n')
  for (const preset of SAMPLE_PRESETS) {
    console.log(`  ${preset.id.padEnd(16)} ${preset.name.padEnd(20)} ${preset.file}`)
  }
  console.log('\nUse --preset <id> to load the file and its suggested mapping.')
}

async function main(): Promise<void> {
  let values: CliArgs

  try {
    const parsed = parseArgs({
      options: {
        input: { type: 'string', short: 'i' },
        out: { type: 'string', short: 'o' },
        config: { type: 'string', short: 'c' },
        preset: { type: 'string', short: 'p' },
        headerless: { type: 'boolean' },
        tempo: { type: 'string', short: 't' },
        'list-presets': { type: 'boolean' },
        help: { type: 'boolean', short: 'h' }
      },
      allowPositionals: false,
      strict: true
    })
    values = parsed.values as CliArgs
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    printUsage()
    process.exitCode = 1
    return
  }

  if (values.help) {
    printUsage()
    return
  }

  if (values['list-presets']) {
    printPresets()
    return
  }

  const preset = values.preset ? getSamplePreset(values.preset) : undefined
  if (values.preset && !preset) {
    throw new Error(`Unknown preset "${values.preset}". Use --list-presets to see the options.`)
  }

  const inputPath = values.input ?? (preset ? join(process.cwd(), 'data', preset.file) : undefined)

  if (!inputPath) {
    throw new Error('--input is required unless --preset is used.')
  }

  const autoPreset = values.input
    ? SAMPLE_PRESETS.find(
        (entry) => resolve(join(process.cwd(), 'data', entry.file)) === resolve(inputPath)
      )
    : undefined
  const activePreset = preset ?? autoPreset
  const configPreset = values.config ? undefined : activePreset
  const header = values.headerless ? false : (activePreset?.header ?? true)
  const text = await readFile(inputPath, 'utf8')
  const dataset = parseCsv(text, { header })

  let config: SonificationConfig

  if (values.config) {
    const raw = JSON.parse(await readFile(values.config, 'utf8')) as unknown
    config = sonificationConfigSchema.parse(raw)
  } else if (configPreset) {
    config = structuredClone(configPreset.config)
  } else {
    config = createConfigForColumns(dataset.columns)
  }

  if (values.tempo !== undefined) {
    const tempo = Number(values.tempo)
    if (!Number.isFinite(tempo)) {
      throw new Error(`Invalid tempo: ${values.tempo}`)
    }
    config = { ...config, tempo }
  }

  const notes = sonify(dataset.rows, config)
  const sourceName = basename(inputPath, extname(inputPath))
  const midi = buildMidi(notes, {
    tempo: config.tempo,
    trackName: `${sourceName} sonification`
  })

  const outPath = values.out ?? join('out', `${basename(inputPath, extname(inputPath))}.mid`)

  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, midi.toArray())

  console.log(`Input:    ${inputPath}`)
  console.log(`Preset:   ${configPreset?.name ?? 'custom'}`)
  console.log(`Columns:  ${dataset.columns.join(', ')}`)
  console.log(`Rows:     ${dataset.rows.length}`)
  console.log(`Notes:    ${notes.length}`)
  console.log(`Tempo:    ${config.tempo} BPM`)
  console.log(`Duration: ${midi.duration.toFixed(2)} s`)
  console.log(`Written:  ${outPath}`)

  const unmapped = unmappedFields(dataset.columns, config)
  if (unmapped.length > 0) {
    console.warn(
      `\nWarning: unmapped columns: ${unmapped.join(', ')}. ` +
        'Every input indicator should affect at least one MIDI parameter.'
    )
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
