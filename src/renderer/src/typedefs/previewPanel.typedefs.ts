import type { Preview } from '@renderer/types'

export interface PreviewPanelProps {
  preview: Preview
  playing: boolean
  progress: number
  onPlay: () => void
}
