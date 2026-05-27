import { useEffect, useState } from 'react'

// Typed async hook for on-demand reads (e.g. the Review question detail).
// Cancels stale results so a fast deps change can't overwrite with an older
// response. Failure is captured in `error`, never thrown into render (¶V2:
// a failed live read leaves the caller free to fall back to sample data).
export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: unknown
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })

  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true, error: null }))
    fn().then(
      (data) => { if (alive) setState({ data, loading: false, error: null }) },
      (error) => { if (alive) setState({ data: null, loading: false, error }) }
    )
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
