import { contextBridge } from 'electron'

// Bridge backend connection config from the main/Node environment into the
// renderer. Values come from the shell env (or the backend's .env when the app
// is launched alongside it). The X-Coach-Token is the shared secret the API
// requires on most routes (see docs/BACKEND_CORE.md §Auth).
const config = {
  apiBase: process.env['GRADIENT_API_BASE'] || 'http://localhost:8000',
  coachToken: process.env['COACH_TOKEN'] || '',
  courseSlug: process.env['GRADIENT_COURSE_SLUG'] || 'aamc',
  platform: process.platform
}

contextBridge.exposeInMainWorld('gradient', config)
