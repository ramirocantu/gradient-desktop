# Gradient Desktop — SPEC

Caveman per `../FORMAT.md`. `⊥` = forbidden. Sections use `¶` prefix (vs the
backend spec's `§`) to keep the two distinct. This spec governs the desktop
client only. Backend = `gradient-server` (`../SPEC.md`); endpoints it owns are
external surfaces here. Missing backend endpoints flagged `?`.

## ¶G

Wire desktop client to live Gradient API on every surface; kill all sample/stub
overlays. Offline fallback stays.

## ¶A

- React 18 + TS, electron-vite (main / preload / renderer roots). Native macOS
  window (`titleBarStyle hiddenInset`).
- `src/renderer/src/data/store.tsx` = per-domain overlay: base mock → live
  result swapped in per domain when reachable. `data/client.ts` fetch wrapper
  (X-Coach-Token, timeout). `data/api.ts` typed endpoint fns. adapters map API
  payload → view shape (`adapt*` in store).
- preload (`src/preload/index.ts`) bridges `window.gradient` = {apiBase,
  coachToken, courseSlug, platform} from env.
- views read one composite `DB` via `useDB()`; field names = design prototype.

## ¶C

- TS strict on. No react-query (small `useAsync` ok). ⊥ heavy data libs.
- Backend unreachable ⇒ app still navigable on sample data.
- New data need ⇒ extend backend public `/api/v1/*` (+ service), ⊥ private /
  dashboard-only route (mirrors backend V-D1).
- All token-gated calls send `X-Coach-Token`. CORS = loopback (dev origin
  `localhost:5173`); packaged `file://` origin needs CORS widen — out of scope.
- Pixel-faithful to design proposal `gradient-learning-darwin`. CSS verbatim.

## ¶I

### backend endpoints consumed (live today)
- `GET /api/v1/courses` · `GET /api/v1/tutor/outline?course=` — course + tree.
- `GET /api/v1/tutor/attempts/flagged` — review queue count.
- `GET /api/v1/tutor/sessions/recent` · `…/sessions/{test_id}/summary`.
- `GET /api/v1/tutor/captures/recent` — captures inbox.
- `GET /api/v1/anki/review-queue` · `GET /api/v1/anki/load-config`.
- `GET /api/v1/tutor/questions/by-qid/{qid}` · `GET /api/v1/anki/cards/by-qid/{qid}` — on Review open.
- `POST /api/v1/pkm/discriminators` — discriminator save (live write).
- `POST /api/v1/courses` + `POST /api/v1/courses/{id}/outline:import` — onboarding (live writes).
- `GET /api/v1/tutor/healthz` · `GET /api/v1/admin/jobs` — settings status (not yet wired).

### backend endpoints NEEDED — do not exist yet (?)
- `?` per-node / subtree **mastery** rollup (analytics FENCED, backend V-RB1; needs OutlineNode + `outline_subtree` rollup, V-O1).
- `?` **answer distribution** + **attempt history** per qid (aggregate over `Attempt`).
- `?` **concept_edges** read (recent connections / edges-by-node) — backend P2/P3.
- `?` **atomic_facts** read (by node / by pdf) — backend P2.
- `?` **notion_pages** read (page index + status) — backend P2.
- `?` **pdf_sources** read (inbox) — backend P2.
- `?` `/anki/load-adherence` extended to per-day series (today: single projected number).

### env (preload → renderer)
- `GRADIENT_API_BASE` (def `http://localhost:8000`) · `COACH_TOKEN` · `GRADIENT_COURSE_SLUG` (def `aamc`).

## ¶V

- V1: every view domain is live OR carries explicit `stub-badge`. ⊥ silent mock shown as live.
- V2: backend unreachable ⇒ app fully navigable on sample data; ⊥ crash / blank screen.
- V3: raw API shape stays in `data/` (client/api/adapt). ⊥ leak API field names into view JSX.
- V4: new data need ⇒ backend public `/api/v1/*` route. ⊥ private/dashboard route (backend V-D1).
- V5: writes safe — discriminator dedup `(question_id, factor_text)`; HTTP 409 = already-saved = success. ⊥ duplicate-on-retry.
- V6: mastery / connections / atomic_facts / notion shown from real endpoint only; until endpoint ships, sample-badged. ⊥ fabricate per-node mastery as if measured.
- V7: token-gated reads degrade independently (`Promise.allSettled`). One 401/500 ⊥ blank whole app.
- V8: apiBase + coachToken + courseSlug from env/preload. ⊥ hardcode in renderer.
- V9: each domain swapped live ⇒ its `stub-badge` removed same change. ⊥ domain both live + badged.
- V10: a ¶T marked "no backend change" must consume a field an existing endpoint actually **populates**. ⊥ assume TODO-stubbed / empty payload fields (e.g. `captures.topics`, session `by_topic`). Verify payload non-empty before tagging buildable-now. (¶B1)

## ¶P

- P1 — wire surfaces backed by existing endpoints. NOTE (¶B1): captures node labels + session node attr need backend node-tag surfacing (backend T38) — not no-backend as first scoped; client adapter forward-compatible meanwhile. Settings status partly available now.
- P2 — enrich question + anki (distribution, attempt history, retention col, daily load series) — needs small backend extensions.
- P3 — mastery: unfence/expose analytics rollup → wire; drop mastery sample-badge.
- P4 — KB stubs: concept_edges / atomic_facts / notion_pages / pdf_sources reads (after backend P2/P3) → wire.
- P5 — polish: real Socratic tutor (MCP host / `window.claude`), search palette, manual capture entry.

## ¶O

- Backend deps block P2–P4. Owned by `../SPEC.md`: unfence analytics (backend T17), KB substrate models+migrations (T24), KB service seams (T26), retrieval+grounded gen (T28–T30). Desktop tasks here cite the missing endpoint, not the backend impl.
- Packaged-app CORS (`file://`) unresolved — dev only for now.
- Tutor chat is mocked dialogue (`TUTOR_MESSAGES`); discriminator save already live.

## ¶T

| id | st | goal | cites |
|----|----|------|-------|
| T1 | ~ | map `captures.topics` → node label in `adaptCaptures` (resolve node_id→name via NODE_BY_ID); drop captures sample-badge when live. Client adapter done (`firstTopicNodeId`); flows once backend T38 returns node_id (¶B1,¶V10) | V3,V9,?backend-T38 |
| T2 | . | wire session node attribution + per-question outcome grid from `…/sessions/{id}/summary` (`by_topic`,`top_topics`, per-attempt correct/flag). Blocked: by_topic empty + no per-attempt array (¶B1) | V3,V7,?backend-T38 |
| T3 | . | settings connections panel: drive AnkiConnect/Notion/OpenAI/MCP status from `GET /tutor/healthz` + `/admin/jobs` ⊥ static rows | V3,V7 |
| T4 | x | add typed `useAsync` + per-view loading skeletons; per-domain failure isolated (`allSettled`) ⊥ block app | V2,V7 |
| T5 | . | Review: replace sample `picked`/`distribution`/`pastAttempts` with live — backend adds distribution + attempt-history to `by-qid` (?) | V3,V6 |
| T6 | . | Anki: consume real retention col + per-day load series from extended `/anki/load-adherence` (?) ⊥ lapse-derived retention + sampled `ANKI_LOAD` | V3,V6 |
| T7 | . | Mastery: replace `pseudoMastery` overlay with per-node/subtree rollup endpoint (?) (backend unfence analytics, V-O1 set rollup); remove mastery sample-badge | V6,V9,V4 |
| T8 | . | Connections feed: replace `CONNECTIONS` sample with `concept_edges` read API (?) (recent edges / by-node); via/score/kind from real edges | V6,V9,V4 |
| T9 | . | Atomic facts: replace `FACTS` sample with `atomic_facts` read API (?) (by node / by pdf); wire FactsView + NodeFactsList + Review linked-facts | V6,V9,V4 |
| T10 | . | Notion pages: replace `NOTION_PAGES` sample with `notion_pages` read API (?) (page index + status) | V6,V9,V4 |
| T11 | . | PDFs: replace `PDFS` sample with `pdf_sources` read API (?) (inbox + per-pdf facts) | V6,V9,V4 |
| T12 | . | Tutor chat: wire real Socratic turn via MCP host / `window.claude` ⊥ `TUTOR_MESSAGES` mock; keep discriminator save | V5 |
| T13 | . | extend `data/api.ts` with each new endpoint fn + raw type as backend ships; adapters only ⊥ view-level fetch | V3 |
| T14 | . | audit: assert no domain both live + sample-badged after each wire | V1,V9 |

## ¶B

| id | date | cause | fix |
| B1 | 2026-05-27 | ¶T1/¶T2 scoped "no backend change" but the fields they consume are empty TODO stubs in the backend — `captures.topics` always `[]` (`app/services/tutor/captures.py:30`), session `by_topic`/`top_topics` always `[]` (`sessions.py:85`), and summary has no per-attempt correctness array. Found at build plan time, not test time. | Added ¶V10 (verify payload populated before tagging no-backend). Client adapter `firstTopicNodeId` made forward-compatible (accepts id / `{node_id}` / `{id}`); ¶T1 held at `~`. Backend surfacing tracked in `../SPEC.md` T38. ¶T1/¶T2 cites now flag `?backend-T38`. |
|----|------|-------|-----|
