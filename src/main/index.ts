import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { sanitizePatch, type ConfigPatch } from '../preload/config'

// Persisted user config (apiBase + coachToken) lives in a JSON file under the
// app's userData dir. The renderer never touches disk — it goes through these
// IPC channels (¶V8). Token is stored plaintext (same exposure as the env var
// it overrides); OS keychain is a future hardening.
function configPath(): string {
  return join(app.getPath('userData'), 'gradient-config.json')
}

function readPersistedConfig(): ConfigPatch {
  try {
    return sanitizePatch(JSON.parse(readFileSync(configPath(), 'utf8')))
  } catch {
    return {} // no file yet / unreadable → env defaults apply
  }
}

function writePersistedConfig(patch: unknown): ConfigPatch {
  const merged = { ...readPersistedConfig(), ...sanitizePatch(patch) }
  try {
    mkdirSync(app.getPath('userData'), { recursive: true })
    writeFileSync(configPath(), JSON.stringify(merged, null, 2), 'utf8')
  } catch {
    /* best-effort persist; live session still uses the value via the renderer */
  }
  return merged
}

// Synchronous read so the preload can build window.gradient before the renderer
// boots; async write for Save.
ipcMain.on('gradient:get-config', (e) => {
  e.returnValue = readPersistedConfig()
})
ipcMain.handle('gradient:set-config', (_e, patch) => writePersistedConfig(patch))

// The design draws its content edge-to-edge with the macOS traffic lights
// living over the top-left of the sidebar. `hiddenInset` gives us exactly that:
// native traffic lights overlaid on our own chrome, no system title bar.
function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#f7f3ec', // --paper, avoids white flash before paint
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 14, y: 18 },
    webPreferences: {
      // ESM preload (.mjs) — the project is "type": "module", so electron-vite
      // emits the preload as ESM; Electron 33 loads it with sandbox disabled.
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // electron-vite injects ELECTRON_RENDERER_URL in dev (the Vite server);
  // in a packaged build we load the bundled HTML.
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
