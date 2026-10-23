import type { ElectronAPI } from '@electron-toolkit/preload'
import type { MediaLabApi } from '../shared/ipc'

declare global {
  interface Window {
    electron: ElectronAPI
    api: MediaLabApi
  }
}
