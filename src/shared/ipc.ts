import type { Dataset } from '../core/types'

/** Channel names shared by the main process, preload, and renderer. */
export const IPC = {
  openCsv: 'csv:open',
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
  saveMidi: (bytes: Uint8Array, defaultName?: string) => Promise<SaveMidiResult>
  openMidi: (filePath: string) => Promise<OpenMidiResult>
}
