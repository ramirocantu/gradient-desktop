// Pure config resolution shared by the Electron main process (disk persistence)
// and the preload bridge (builds `window.gradient`). No electron/node imports —
// kept side-effect-free so both build roots and the renderer test suite can use
// it. The persisted user config layers over the shell env (¶V8).

// The only two values the desktop client lets a user set — the pair it needs to
// reach the backend (¶V13). courseSlug stays env/onboarding, never set here.
export interface ConfigPatch {
  apiBase?: string
  coachToken?: string
}

export interface ResolvedConfig {
  apiBase: string
  coachToken: string
}

// Precedence: persisted user value > env default > built-in default (¶V8). An
// empty apiBase is treated as absent (never a valid base URL); an empty
// coachToken IS meaningful — a user clearing it persists "no token".
export function resolveConfig(
  persisted: ConfigPatch,
  env: ConfigPatch,
  def: ResolvedConfig
): ResolvedConfig {
  const nonEmpty = (...vals: (string | undefined)[]): string =>
    vals.find((v) => v != null && v !== '') ?? ''
  return {
    apiBase: nonEmpty(persisted.apiBase, env.apiBase, def.apiBase),
    coachToken: persisted.coachToken ?? nonEmpty(env.coachToken, def.coachToken)
  }
}

// Whitelist an inbound patch to the two settable keys, dropping anything else
// (¶V13). Non-string values are ignored. Guards the disk writer + IPC boundary
// so the renderer can never persist arbitrary keys.
export function sanitizePatch(patch: unknown): ConfigPatch {
  const p = (patch ?? {}) as Record<string, unknown>
  const out: ConfigPatch = {}
  if (typeof p.apiBase === 'string') out.apiBase = p.apiBase
  if (typeof p.coachToken === 'string') out.coachToken = p.coachToken
  return out
}
