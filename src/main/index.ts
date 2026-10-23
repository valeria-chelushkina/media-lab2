import { app, shell, BrowserWindow, dialog, ipcMain } from 'electron'
import type { OpenDialogOptions, SaveDialogOptions } from 'electron'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { parseCsv } from '../core/loadCsv'
import { IPC, type OpenCsvResult, type SaveMidiResult } from '../shared/ipc'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: 'Data Sonifier',
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpcHandlers(): void {
  ipcMain.removeHandler(IPC.openCsv)
  ipcMain.handle(IPC.openCsv, async (): Promise<OpenCsvResult> => {
    const options: OpenDialogOptions = {
      title: 'Open numeric data',
      properties: ['openFile'],
      filters: [{ name: 'CSV', extensions: ['csv', 'txt'] }]
    }
    const parent = BrowserWindow.getFocusedWindow() ?? mainWindow
    const result = parent
      ? await dialog.showOpenDialog(parent, options)
      : await dialog.showOpenDialog(options)

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true }
    }

    const filePath = result.filePaths[0]
    try {
      const text = await readFile(filePath, 'utf8')
      return { canceled: false, filePath, dataset: parseCsv(text) }
    } catch (error) {
      return { canceled: false, filePath, error: toMessage(error) }
    }
  })

  ipcMain.removeHandler(IPC.saveMidi)
  ipcMain.handle(
    IPC.saveMidi,
    async (_event, bytes: Uint8Array, defaultName?: string): Promise<SaveMidiResult> => {
      if (!(bytes instanceof Uint8Array)) {
        return { canceled: false, error: 'Invalid MIDI payload' }
      }

      const safeName = (defaultName?.trim() || 'sonification.mid').replace(/[<>:"/\\|?*]/g, '-')
      const fileName = /\.mid$/i.test(safeName) ? safeName : `${safeName}.mid`

      const options: SaveDialogOptions = {
        title: 'Save MIDI file',
        defaultPath: join(app.getPath('documents'), fileName),
        filters: [{ name: 'MIDI', extensions: ['mid'] }]
      }
      const parent = BrowserWindow.getFocusedWindow() ?? mainWindow
      const result = parent
        ? await dialog.showSaveDialog(parent, options)
        : await dialog.showSaveDialog(options)

      if (result.canceled || !result.filePath) {
        return { canceled: true }
      }

      try {
        await writeFile(result.filePath, Buffer.from(bytes))
        return { canceled: false, filePath: result.filePath }
      } catch (error) {
        return { canceled: false, error: toMessage(error) }
      }
    }
  )
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.medialab.sonifier')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
