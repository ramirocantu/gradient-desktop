# Gradient — Desktop (macOS)

React + Electron implementation of the Claude Design proposal
(`gradient-learning-darwin`). A warm, Notion-adjacent study client over the
Gradient FastAPI backend.

**Course-agnostic.** Gradient started as an MCAT tool; it is being generalized
so any user can upload their own course (structured outline, JSON/YAML) and
study against it. MCAT (`slug: aamc`) is just the seed course — no section
codes, UWorld, or AAMC assumptions are baked into the client. See `CLAUDE.md`
for the redesign north-star and `SPEC.md` for invariants.

## Stack

- **Electron** (native macOS window, `titleBarStyle: hiddenInset`)
- **React 18 + TypeScript**, bundled with **electron-vite**
- Hand-written typed API client (`src/renderer/src/data/`) over the backend
  contract in `../docs/openapi.json` / `../docs/BACKEND_CORE.md`
- Design CSS ported verbatim (`src/renderer/src/styles.css`)

## Run

```bash
cd desktop
npm install
npm run dev          # launches Electron pointed at the Vite dev server
```

Build / preview a production bundle:

```bash
npm run build
npm run start
npm run typecheck
```

## Backend connection

The app reads connection config from the environment (bridged into the
renderer by `src/preload/index.ts`):

| Var | Default | Purpose |
|---|---|---|
| `GRADIENT_API_BASE` | `http://localhost:8000` | FastAPI base URL |
| `COACH_TOKEN` | _(empty)_ | `X-Coach-Token` for token-gated routes |
| `GRADIENT_COURSE_SLUG` | `aamc` | Which course to load |

Start the backend first (`uvicorn app.main:app --reload` from
`../gradient-server`, with a course outline seeded — `aamc` is the default
`GRADIENT_COURSE_SLUG`). There is **no sample-data fallback**: with the backend
unreachable, or a read returning empty, the app stays fully navigable on
skeletons (loading) and empty-states — never mock data shown as if measured.

## What's wired vs. empty

Data flows through a per-domain overlay (`src/renderer/src/data/store.tsx`):
the store starts from an **empty base** and swaps in each domain's live backend
result when reachable. Domains with no endpoint yet stay empty and the view
renders an `EmptyState` (with a no-endpoint badge).

| Domain | Source |
|---|---|
| Courses, outline tree | **live** (`/api/v1/tutor/outline`, `/courses`) |
| Flagged attempts, recent sessions, captures | **live** (token) |
| Anki review queue, load budget | **live** (token) |
| Question review detail + linked Anki | **live** on open (`/tutor/questions/by-qid`, `/anki/cards/by-qid`) |
| Per-node mastery | **live** (`/outline/.../mastery`) |
| Connections, atomic facts, Notion pages, PDFs | **live** (KB-substrate reads) |
| **Discriminator save** | **live write** (`POST /pkm/discriminators`) |
| **Add-a-course** (onboarding) | **live writes** (`POST /courses`, `outline:import`) |
| Tutor chat | empty-state — MCP host pending (`¶T12`) |

When a new backend workflow lands, swap its overlay in `store.tsx` for the
endpoint and drop the domain's empty-state badge — the view code is unchanged.
