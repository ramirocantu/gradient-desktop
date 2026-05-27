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

declare global {
  interface Window {
    gradient?: GradientConfig
  }
}

export const cfg: GradientConfig = window.gradient ?? {
  apiBase: 'http://localhost:8000',
  coachToken: '',
  courseSlug: 'aamc'
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
