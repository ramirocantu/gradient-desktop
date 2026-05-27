# Gradient — Desktop (macOS)

React + Electron implementation of the Claude Design proposal
(`gradient-learning-darwin`). A warm, Notion-adjacent study client over the
Gradient FastAPI backend.

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

Start the backend first (`uvicorn app.main:app --reload` from the repo root,
with the AAMC outline seeded). With no backend reachable the app stays fully
clickable on bundled **sample data** (the sidebar footer shows *Offline ·
sample data*).

## What's wired vs. sampled

Data flows through a per-domain overlay (`src/renderer/src/data/store.tsx`):
each domain uses the live backend when reachable and falls back to sample data
otherwise.

| Domain | Source |
|---|---|
| Courses, outline tree | **live** (`/api/v1/tutor/outline`, `/courses`) |
| Flagged attempts, recent sessions, captures | **live** (token) |
| Anki review queue, load budget | **live** (token) |
| Question review detail + linked Anki | **live** on open (`/tutor/questions/by-qid`, `/anki/cards/by-qid`) |
| **Discriminator save** | **live write** (`POST /pkm/discriminators`) |
| **Add-a-course** (onboarding) | **live writes** (`POST /courses`, `outline:import`) |
| Per-node mastery | sample — analytics service is FENCED (BACKEND_CORE §7) |
| Connections feed | sample — `concept_edges` is P2 (no endpoint) |
| Atomic facts, Notion pages | sample — P2 KB substrate (no endpoint) |

Surfaces without a live endpoint carry a small **sample / P2** badge so the gap
is explicit rather than implied. When those backend workflows land, swap the
mock overlay in `store.tsx` for the new endpoint — the view code is unchanged.
