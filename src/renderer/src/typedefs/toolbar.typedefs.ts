import type { Status } from '@renderer/types'

export interface ToolbarProps {
  hasHeader: boolean
  status: Status
  busy: boolean
  canGenerate: boolean
  hasSavedFile: boolean
  onHasHeaderChange: (hasHeader: boolean) => void
  onOpenCsv: () => void
  onLoadSample: (presetId: string) => void
  onGenerate: () => void
  onOpenSaved: () => void
}
