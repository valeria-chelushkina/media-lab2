import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC, type MediaLabApi } from '@shared/ipc'
const api: MediaLabApi = {
  openCsv: (hasHeader) => ipcRenderer.invoke(IPC.openCsv, hasHeader),
  openSample: (presetId) => ipcRenderer.invoke(IPC.openSample, presetId),
  saveMidi: (bytes, defaultName) => ipcRenderer.invoke(IPC.saveMidi, bytes, defaultName),
  openMidi: (filePath) => ipcRenderer.invoke(IPC.openMidi, filePath)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
