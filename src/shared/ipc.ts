import type { Dataset } from '../core/types'

export const IPC = {
  openCsv: 'csv:open',
  openSample: 'sample:open',
  saveMidi: 'midi:save',
  openMidi: 'midi:open'
} as const

export interface OpenCsvResult {
  canceled: boolean
  filePath?: string
  dataset?: Dataset
  warning?: string
  error?: string
}

export interface SaveMidiResult {
  canceled: boolean
  filePath?: string
  error?: string
}

export interface OpenMidiResult {
  ok: boolean
  error?: string
}

export interface MediaLabApi {
  openCsv: (hasHeader?: boolean) => Promise<OpenCsvResult>
  openSample: (presetId: string) => Promise<OpenCsvResult>
  saveMidi: (bytes: Uint8Array, defaultName?: string) => Promise<SaveMidiResult>
  openMidi: (filePath: string) => Promise<OpenMidiResult>
}
