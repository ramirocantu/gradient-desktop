import { describe, it, expect } from 'vitest'

// client.ts reads window.gradient at module load; stub before dynamic import
// (a static import hoists above this assignment and crashes on `window`).
// FROZEN on purpose: contextBridge.exposeInMainWorld deep-freezes the bridged
// object, so cfg must copy it — aliasing the frozen object makes applyConfig
// throw (¶B3 / ¶V14).
;(globalThis as { window?: unknown }).window ??= {
  gradient: Object.freeze({ apiBase: 'http://localhost:8000', coachToken: '', courseSlug: 'aamc' })
}

const { cfg, applyConfig, isValidApiBase } = await import('./client')

// ¶T20 / ¶V8: applyConfig updates the live config in place so reads pick up the
// new values without an app restart; persistence is the main process's job.
describe('applyConfig — mutates live cfg (¶V8)', () => {
  it('updates apiBase and coachToken on the live cfg object', () => {
    applyConfig({ apiBase: 'http://changed:9000', coachToken: 'new-token' })
    expect(cfg.apiBase).toBe('http://changed:9000')
    expect(cfg.coachToken).toBe('new-token')
  })

  it('only touches the keys present in the patch', () => {
    applyConfig({ apiBase: 'http://only-base' })
    expect(cfg.apiBase).toBe('http://only-base')
    expect(cfg.coachToken).toBe('new-token') // unchanged from prior test
    expect(cfg.courseSlug).toBe('aamc') // never settable here (¶V13)
  })
})

// ¶T20: Save is blocked unless apiBase is an absolute http(s) URL.
describe('isValidApiBase', () => {
  it('accepts http and https absolute URLs', () => {
    expect(isValidApiBase('http://localhost:8000')).toBe(true)
    expect(isValidApiBase('https://api.example.com')).toBe(true)
  })
  it('rejects empty, relative, or non-http(s) values', () => {
    expect(isValidApiBase('')).toBe(false)
    expect(isValidApiBase('localhost:8000')).toBe(false)
    expect(isValidApiBase('ftp://x')).toBe(false)
    expect(isValidApiBase('not a url')).toBe(false)
  })
})
