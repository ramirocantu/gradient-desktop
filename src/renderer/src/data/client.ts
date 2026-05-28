// Thin typed HTTP client for the Gradient FastAPI backend.
// Config (API base + X-Coach-Token + course slug) is injected by the Electron
// preload bridge as `window.gradient`; in a plain browser dev context it falls
// back to sensible localhost defaults.

interface GradientConfig {
  apiBase: string
  coachToken: string
  courseSlug: string
  platform?: string
}

// The two values a user may change at runtime via Settings (¶V13).
export interface ConfigPatch {
  apiBase?: string
  coachToken?: string
}

declare global {
  interface Window {
    gradient?: GradientConfig & {
      // Persist a config change to disk via the main process (¶V8). Present
      // only under Electron; undefined in a plain browser dev context.
      save?: (patch: ConfigPatch) => Promise<unknown>
    }
  }
}

// A MUTABLE copy of the bridged config — never the bridge object itself.
// contextBridge.exposeInMainWorld deep-freezes `window.gradient`, so aliasing
// it would make applyConfig's writes throw "Cannot assign to read only
// property". Copy the fields into a fresh object we own.
export const cfg: GradientConfig = {
  apiBase: window.gradient?.apiBase ?? 'http://localhost:8000',
  coachToken: window.gradient?.coachToken ?? '',
  courseSlug: window.gradient?.courseSlug ?? 'aamc',
  platform: window.gradient?.platform
}

// Update the live in-memory config so in-flight reads pick up new values
// without an app restart (the `api` helper reads cfg at request time). Disk
// persistence is owned by the main process via window.gradient.save (¶V8).
export function applyConfig(patch: ConfigPatch): void {
  if (typeof patch.apiBase === 'string') cfg.apiBase = patch.apiBase
  if (typeof patch.coachToken === 'string') cfg.coachToken = patch.coachToken
}

// Apply to the live session immediately, then persist via main (best-effort).
export async function saveConfig(patch: ConfigPatch): Promise<void> {
  applyConfig(patch)
  await window.gradient?.save?.(patch)
}

// apiBase must be an absolute http(s) URL — block Save otherwise.
export function isValidApiBase(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// One-shot reachability probe against entered values WITHOUT mutating cfg —
// backs the Settings "Test" button. healthz is an open route.
export async function probeConfig(apiBase: string, token: string): Promise<boolean> {
  if (!isValidApiBase(apiBase)) return false
  try {
    const res = await fetch(`${apiBase.replace(/\/+$/, '')}/api/v1/tutor/healthz`, {
      headers: token ? { 'X-Coach-Token': token } : {}
    })
    return res.ok
  } catch {
    return false
  }
}

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

interface ReqOpts {
  method?: string
  body?: unknown
  query?: Record<string, string | number | undefined>
  auth?: boolean // attach X-Coach-Token (default true)
  timeoutMs?: number
}

export async function api<T>(path: string, opts: ReqOpts = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true, timeoutMs = 8000 } = opts

  const url = new URL(path, cfg.apiBase)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v))
    }
  }

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (auth && cfg.coachToken) headers['X-Coach-Token'] = cfg.coachToken

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal
    })
    const text = await res.text()
    const data = text ? JSON.parse(text) : null
    if (!res.ok) {
      throw new ApiError(res.status, `${method} ${path} → ${res.status}`, data)
    }
    return data as T
  } finally {
    clearTimeout(timer)
  }
}
