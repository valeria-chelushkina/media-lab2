import type { Dataset } from '../core/types'

/** Channel names shared by the main process, preload, and renderer. */
export const IPC = {
  openCsv: 'csv:open',
  saveMidi: 'midi:save'
} as const

export interface OpenCsvResult {
  canceled: boolean
  filePath?: string
  dataset?: Dataset
  error?: string
}

export interface SaveMidiResult {
  canceled: boolean
  filePath?: string
  error?: string
}

export interface MediaLabApi {
  openCsv: () => Promise<OpenCsvResult>
  saveMidi: (bytes: Uint8Array, defaultName?: string) => Promise<SaveMidiResult>
}
