// settleAll — run independent backend reads concurrently and isolate failure.
// One rejected promise must not drop its siblings (¶V7): rejected entries
// resolve to `undefined`, fulfilled entries keep their value. Pure + typed so
// the isolation guarantee is unit-testable without React.
export async function settleAll<T extends Record<string, Promise<unknown>>>(
  tasks: T
): Promise<{ [K in keyof T]: Awaited<T[K]> | undefined }> {
  const keys = Object.keys(tasks) as (keyof T)[]
  const results = await Promise.allSettled(keys.map((k) => tasks[k]))
  const out = {} as { [K in keyof T]: Awaited<T[K]> | undefined }
  keys.forEach((k, i) => {
    const r = results[i]
    out[k] = (r.status === 'fulfilled' ? r.value : undefined) as Awaited<T[keyof T]> | undefined
  })
  return out
}
