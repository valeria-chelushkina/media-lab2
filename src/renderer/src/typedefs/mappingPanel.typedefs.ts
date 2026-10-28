import type { SonificationConfig } from '@core/config'
import type { Dataset } from '@core/types'

export interface MappingPanelProps {
  dataset: Dataset
  config: SonificationConfig
  unmapped: string[]
  onConfigChange: (config: SonificationConfig) => void
  onReset: () => void
}
