import { app, shell, BrowserWindow, dialog, ipcMain } from 'electron'
import type { OpenDialogOptions, SaveDialogOptions } from 'electron'
import { readFile, writeFile, access } from 'node:fs/promises'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { parseCsv } from '../core/loadCsv'
import { getSamplePreset } from '../core/presets'
import { IPC, type OpenCsvResult, type SaveMidiResult, type OpenMidiResult } from '../shared/ipc'

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
  ipcMain.handle(IPC.openCsv, async (_event, hasHeader = true): Promise<OpenCsvResult> => {
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
    const useHeader = hasHeader !== false

    try {
      const text = await readFile(filePath, 'utf8')
      const dataset = parseCsv(text, { header: useHeader })
      const warning =
        useHeader && dataset.columns.every((column) => NUMERIC_COLUMN.test(column))
          ? 'The first row looks like data. If this file has no header, turn off “First row is header” and reopen it.'
          : undefined

      return { canceled: false, filePath, dataset, warning }
    } catch (error) {
      return { canceled: false, filePath, error: toMessage(error) }
    }
  })

  ipcMain.removeHandler(IPC.openSample)
  ipcMain.handle(IPC.openSample, async (_event, presetId: string): Promise<OpenCsvResult> => {
    const preset = getSamplePreset(presetId)
    if (!preset) {
      return { canceled: false, error: 'Unknown sample preset.' }
    }

    try {
      const filePath = sampleDataPath(preset.file)
      const text = await readFile(filePath, 'utf8')
      return {
        canceled: false,
        filePath,
        dataset: parseCsv(text, { header: preset.header })
      }
    } catch (error) {
      return { canceled: false, error: toMessage(error) }
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

  ipcMain.removeHandler(IPC.openMidi)
  ipcMain.handle(IPC.openMidi, async (_event, filePath: string): Promise<OpenMidiResult> => {
    if (typeof filePath !== 'string' || !/\.(mid|midi)$/i.test(filePath)) {
      return { ok: false, error: 'Only .mid or .midi files can be opened.' }
    }

    try {
      await access(filePath)
      const error = await shell.openPath(filePath)

      if (error) {
        shell.showItemInFolder(filePath)
        return {
          ok: false,
          error: `Could not open the file: ${error}. It was revealed in its folder instead.`
        }
      }

      return { ok: true }
    } catch (error) {
      return { ok: false, error: toMessage(error) }
    }
  })
}

function sampleDataPath(file: string): string {
  const root = app.isPackaged ? process.resourcesPath : app.getAppPath()
  return join(root, 'data', file)
}

const NUMERIC_COLUMN = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/

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
