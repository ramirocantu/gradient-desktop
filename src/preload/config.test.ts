import { describe, it, expect } from 'vitest'
import { resolveConfig, sanitizePatch } from './config'

const DEF = { apiBase: 'http://localhost:8000', coachToken: '' }

// ¶T19 / ¶V8: persisted-user-config layers over the env default.
describe('resolveConfig — precedence persisted > env > default (¶V8)', () => {
  it('persisted value wins over env and default', () => {
    const r = resolveConfig(
      { apiBase: 'http://persisted:9000', coachToken: 'persisted-tok' },
      { apiBase: 'http://env:8001', coachToken: 'env-tok' },
      DEF
    )
    expect(r).toEqual({ apiBase: 'http://persisted:9000', coachToken: 'persisted-tok' })
  })

  it('falls back to env when nothing is persisted', () => {
    const r = resolveConfig({}, { apiBase: 'http://env:8001', coachToken: 'env-tok' }, DEF)
    expect(r).toEqual({ apiBase: 'http://env:8001', coachToken: 'env-tok' })
  })

  it('falls back to built-in default when neither persisted nor env set', () => {
    const r = resolveConfig({}, {}, DEF)
    expect(r).toEqual(DEF)
  })

  it('treats an empty persisted apiBase as absent (→ env) but honors a cleared token', () => {
    const r = resolveConfig(
      { apiBase: '', coachToken: '' },
      { apiBase: 'http://env:8001', coachToken: 'env-tok' },
      DEF
    )
    expect(r.apiBase).toBe('http://env:8001') // empty base skipped
    expect(r.coachToken).toBe('') // user cleared the token → no token
  })
})

// ¶T19 / ¶V13: the persistence boundary accepts only the two settable keys.
describe('sanitizePatch — only apiBase + coachToken cross the boundary (¶V13)', () => {
  it('drops unknown keys and keeps the two settable strings', () => {
    const out = sanitizePatch({
      apiBase: 'http://x',
      coachToken: 't',
      openaiKey: 'sk-leak',
      notionToken: 'secret_leak',
      courseSlug: 'aamc'
    })
    expect(out).toEqual({ apiBase: 'http://x', coachToken: 't' })
  })

  it('ignores non-string values and non-object input', () => {
    expect(sanitizePatch({ apiBase: 123, coachToken: null })).toEqual({})
    expect(sanitizePatch(undefined)).toEqual({})
    expect(sanitizePatch('nope')).toEqual({})
  })
})
