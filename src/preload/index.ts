import { contextBridge, ipcRenderer } from 'electron'
import { resolveConfig, type ConfigPatch } from './config'

// Bridge backend connection config from the main/Node environment into the
// renderer. Values layer as persisted-user-config > shell env > built-in
// default (¶V8): the persisted file (set via Settings → Save) wins, the env
// supplies the seed, the literal is the last resort. The X-Coach-Token is the
// shared secret the API requires on most routes (see docs/BACKEND_CORE.md §Auth).
const persisted = (ipcRenderer.sendSync('gradient:get-config') ?? {}) as ConfigPatch
const resolved = resolveConfig(
  persisted,
  { apiBase: process.env['GRADIENT_API_BASE'], coachToken: process.env['COACH_TOKEN'] },
  { apiBase: 'http://localhost:8000', coachToken: '' }
)

const config = {
  apiBase: resolved.apiBase,
  coachToken: resolved.coachToken,
  courseSlug: process.env['GRADIENT_COURSE_SLUG'] || 'aamc',
  platform: process.platform,
  // Persist a config change to disk via the main process. The renderer also
  // updates its live in-memory cfg so the change takes effect without a restart
  // (¶V8 — renderer never writes disk itself).
  save: (patch: ConfigPatch): Promise<ConfigPatch> =>
    ipcRenderer.invoke('gradient:set-config', patch)
}

contextBridge.exposeInMainWorld('gradient', config)
