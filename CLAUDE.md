# Gradient Desktop — CLAUDE.md

Companion macOS front end (React + Electron) to the **gradient-server** FastAPI
backend at `../gradient-server`. This file is the orientation doc; `SPEC.md`
(repo root) is the source of truth for invariants (`¶V`) and tasks (`¶T`) —
when they disagree, SPEC.md wins. The backend has its own `../gradient-server/SPEC.md`.

## North star (the redesign)

Gradient began as an **MCAT** study tool. It is being generalized into a
**course-agnostic study client**: any user can upload their own course and study
against it. The redesign rule:

> **MCAT is just a seed course — not a special case.** No section codes
> (CP/CARS/BB/PS), no "UWorld", no AAMC assumptions baked into core types,
> views, or the store. The AAMC outline is one importable course (`slug: aamc`),
> nothing more.

When you touch code that hardcodes MCAT vocabulary, treat it as legacy to
generalize, not a contract to preserve. Domain nouns are generic: **course →
outline tree of nodes → questions / cards / facts**. The top-level user-facing
noun is **course**.

### How users bring their own course

Schema arrives as a **structured outline file (JSON / YAML)** imported through
the existing backend onboarding writes:

- `POST /api/v1/courses` — create the course
- `POST /api/v1/courses/{id}/outline:import` — load its node tree

The renderer drives this from the **Onboarding** view (`OnboardingView`). The
import payload shape is a backend contract — defer to
`../gradient-server/SPEC.md` / `docs/openapi.json` rather than re-specifying it
here. In-app outline editing and external (Notion) sync are **not** the upload
path; file import is.

### Core domain primitives (kept, made generic)

All four are first-class and course-scoped:

1. **Outline tree + per-node mastery** — hierarchical nodes, mastery rollup
   overlaid from the analytics endpoints.
2. **Spaced repetition (Anki)** — review queue, load budget, retention.
3. **Question review** — attempt history, answer distribution, flagged queue.
4. **KB substrate** — captures, atomic facts, concept edges, Notion pages, PDF
   sources.

## Architecture

electron-vite splits into three build roots (`electron.vite.config.ts`):

- `src/main/index.ts` — Electron main process (native macOS window,
  `titleBarStyle: hiddenInset`).
- `src/preload/index.ts` — bridges backend config into the renderer as
  `window.gradient = { apiBase, coachToken, courseSlug, platform }`, read from
  env. **Never hardcode apiBase/token/courseSlug in the renderer** (`¶V8`).
- `src/renderer/src/` — the React 18 + TS app. `@/*` aliases to here.

### The data layer is the spine

`src/renderer/src/data/`:

- `client.ts` — `fetch` wrapper: `cfg` (from `window.gradient`), `X-Coach-Token`
  header, timeout, `ApiError`.
- `api.ts` — typed endpoint functions + raw API types (`*Out`, `*Resp`).
- `store.tsx` — **per-domain overlay**. The store starts from an **empty base**
  (`baseDB`, no mock — see `¶B2`); each domain's live API result is swapped in
  when reachable. Unfilled / no-endpoint domains stay empty and the view renders
  an `EmptyState`. `adapt*` functions map raw API payloads → the view-facing
  `DB` shape. Views read one composite `DB` via `useDB()`.
- `settle.ts` (`settleAll`) — token-gated reads degrade **independently**
  (`Promise.allSettled`); one 401/500 must not blank the whole app (`¶V7`).
- `useAsync.ts` — small typed async hook (no react-query; `¶C`).

Raw API field names stay inside `data/` — do **not** leak them into view JSX
(`¶V3`). Views live in `src/renderer/src/views/`, shell/primitives in
`components/`, view-shape types in `types.ts`, helpers in `helpers.ts`.

### Hard rules (full list + rationale in SPEC.md `¶V`)

- **No mock / sample data.** Offline or empty read ⇒ skeletons (loading) +
  empty-states; the app stays navigable, never crashes or blanks (`¶V1`,`¶V2`).
- **No fabricated measurements.** Mastery / connections / atomic facts / Notion
  show real endpoint data only; until an endpoint ships, render an empty-state
  with a no-endpoint badge — never invent per-node mastery or sample rows
  (`¶V6`).
- **New data need ⇒ extend the backend public `/api/v1/*` surface**, not a
  private/dashboard-only route (`¶V4`).
- **Unwired controls** are explicit no-op `StubButton`s (greyed + TODO log), not
  fake-functional buttons (`¶V11`).
- Writes are idempotent-safe: discriminator dedup on `(question_id,
  factor_text)`, HTTP 409 = already-saved = success (`¶V5`).
- Pixel-faithful to the design proto `gradient-learning-darwin`; CSS ported
  verbatim into `styles.css`.

## Commands

```bash
npm install
npm run dev        # electron-vite dev — Electron pointed at the Vite dev server
npm run build      # production bundle
npm run start      # preview the built bundle
npm run typecheck  # tsc --noEmit for renderer + node configs
npm test           # vitest run
```

Start the backend first: `uvicorn app.main:app --reload` from
`../gradient-server`, with a course outline seeded.

## Tooling notes

- **CodeGraph** is indexed for this repo — prefer `codegraph_*` for structural
  questions (callers, impact, definitions) over grep. See `~/.claude/CLAUDE.md`.
- **Spec-driven workflow**: this repo uses the `spec` / `build` / `check` /
  `backprop` skills. Bugs get traced back into SPEC.md `¶B` and may add a `¶V`
  invariant. Don't edit SPEC.md by hand — go through the `spec` skill.

## Known stale docs

`README.md` still describes a **sample-data offline fallback** ("Offline ·
sample data"). That is obsolete — the mock was deleted (`¶B2`) and the base
store is empty. Trust SPEC.md and this file over README until it's refreshed.
