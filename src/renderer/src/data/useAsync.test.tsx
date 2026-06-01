// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { renderHook, waitFor, act, cleanup } from '@testing-library/react'
import { useAsync } from './useAsync'

afterEach(cleanup)

// Manually-settled promise so a test controls exactly when a read resolves.
function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

describe('useAsync', () => {
  it('starts loading, then resolves to {data, loading:false, error:null}', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve(42), []))
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe(42)
    expect(result.current.error).toBeNull()
  })

  it('captures a rejection in `error` without throwing (¶V2/¶V7)', async () => {
    const boom = new Error('read failed')
    const { result } = renderHook(() => useAsync(() => Promise.reject(boom), []))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe(boom)
    expect(result.current.data).toBeNull()
  })

  it('discards a stale in-flight result when deps change — last write wins', async () => {
    const d1 = deferred<string>()
    const d2 = deferred<string>()
    const fns: Record<number, () => Promise<string>> = { 1: () => d1.promise, 2: () => d2.promise }
    const { result, rerender } = renderHook(({ k }) => useAsync(fns[k], [k]), { initialProps: { k: 1 } })

    // Change deps before the first read settles → first effect is cancelled.
    rerender({ k: 2 })

    // The STALE (first) read resolves last in wall-clock terms but must be ignored.
    await act(async () => { d1.resolve('stale'); await Promise.resolve() })
    expect(result.current.data).not.toBe('stale')

    // The CURRENT read wins.
    await act(async () => { d2.resolve('fresh'); await Promise.resolve() })
    await waitFor(() => expect(result.current.data).toBe('fresh'))
  })

  it('returns to loading:true on a dep change, then settles again', async () => {
    const d1 = deferred<string>()
    const d2 = deferred<string>()
    const fns: Record<number, () => Promise<string>> = { 1: () => d1.promise, 2: () => d2.promise }
    const { result, rerender } = renderHook(({ k }) => useAsync(fns[k], [k]), { initialProps: { k: 1 } })

    expect(result.current.loading).toBe(true)
    await act(async () => { d1.resolve('a'); await Promise.resolve() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    rerender({ k: 2 })
    expect(result.current.loading).toBe(true) // new read in flight

    await act(async () => { d2.resolve('b'); await Promise.resolve() })
    await waitFor(() => expect(result.current.data).toBe('b'))
    expect(result.current.loading).toBe(false)
  })
})
