import { describe, it, expect } from 'vitest'
import { settleAll } from './settle'

// ¶V7: a failing token-gated read must not drop its siblings.
describe('settleAll — failure isolation (¶V7)', () => {
  it('keeps fulfilled values when a sibling rejects', async () => {
    const r = await settleAll({
      ok: Promise.resolve(42),
      bad: Promise.reject(new Error('boom')),
      ok2: Promise.resolve('x')
    })
    expect(r.ok).toBe(42)
    expect(r.ok2).toBe('x')
    expect(r.bad).toBeUndefined()
  })

  it('all reject → all undefined, never throws', async () => {
    const r = await settleAll({ a: Promise.reject(1), b: Promise.reject(2) })
    expect(r.a).toBeUndefined()
    expect(r.b).toBeUndefined()
  })

  it('empty input resolves to empty object', async () => {
    const r = await settleAll({})
    expect(r).toEqual({})
  })
})
