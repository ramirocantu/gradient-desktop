# Gradient Desktop — SPEC

Caveman per `../FORMAT.md`. `⊥` = forbidden. Sections use `¶` prefix (vs the
backend spec's `§`) to keep the two distinct. This spec governs the desktop
client only. Backend = `gradient-server` (`../SPEC.md`); endpoints it owns are
external surfaces here. Missing backend endpoints flagged `?`.

## ¶G

Wire desktop client to live Gradient API on every surface; kill all sample/stub
overlays. Mock deleted — empty base + per-domain live overlay. Offline / empty
read ⇒ skeletons + empty-states; ⊥ sample/mock data.

## ¶A

- React 18 + TS, electron-vite (main / preload / renderer roots). Native macOS
  window (`titleBarStyle hiddenInset`).
- `src/renderer/src/data/store.tsx` = per-domain overlay: empty base (`baseDB`,
  ⊥ mock) → live result swapped in per domain when reachable; unfilled domains
  stay empty (view renders EmptyState). `data/client.ts` fetch wrapper
  (X-Coach-Token, timeout). `data/api.ts` typed endpoint fns. adapters map API
  payload → view shape (`adapt*` in store).
- preload (`src/preload/index.ts`) bridges `window.gradient` = {apiBase,
  coachToken, courseSlug, platform} from env.
- views read one composite `DB` via `useDB()`; field names = design prototype.

## ¶C

- TS strict on. No react-query (small `useAsync` ok). ⊥ heavy data libs.
- Backend unreachable ⇒ app still navigable via skeletons (loading) + empty-states; ⊥ mock/sample fallback.
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

- V1: every view domain is live OR carries explicit empty-state (live-read-empty / no-endpoint badge). ⊥ silent mock shown as live.
- V2: backend unreachable OR live read empty ⇒ app fully navigable via skeletons (loading) + empty-states; ⊥ crash / blank screen; ⊥ mock/sample fallback.
- V3: raw API shape stays in `data/` (client/api/adapt). ⊥ leak API field names into view JSX.
- V4: new data need ⇒ backend public `/api/v1/*` route. ⊥ private/dashboard route (backend V-D1).
- V5: writes safe — discriminator dedup `(question_id, factor_text)`; HTTP 409 = already-saved = success. ⊥ duplicate-on-retry.
- V6: mastery / connections / atomic_facts / notion shown from real endpoint only; until endpoint ships, empty-state (no-endpoint badge). ⊥ fabricate per-node mastery or sample rows as if measured.
- V7: token-gated reads degrade independently (`Promise.allSettled`). One 401/500 ⊥ blank whole app.
- V8: apiBase + coachToken + courseSlug from env/preload. ⊥ hardcode in renderer.
- V9: each domain swapped live ⇒ its empty-state / no-endpoint badge removed same change. ⊥ domain both live + badged.
- V10: a ¶T marked "no backend change" must consume a field an existing endpoint actually **populates**. ⊥ assume TODO-stubbed / empty payload fields (e.g. `captures.topics`, session `by_topic`). Verify payload non-empty before tagging buildable-now. (¶B1)
- V11: store base (`baseDB`) = empty (⊥ bundled mock); live API overlays per domain. Unwired controls = no-op `StubButton` (greyed indicator + TODO log), ⊥ fake-functional button silently doing nothing. (¶B2)

## ¶P

- P1 — wire surfaces backed by existing endpoints. NOTE (¶B1): captures node labels + session node attr need backend node-tag surfacing (backend T38) — not no-backend as first scoped; client adapter forward-compatible meanwhile. Settings status partly available now.
- P2 — enrich question + anki (distribution, attempt history, retention col, daily load series) — needs small backend extensions.
- P3 — mastery: unfence/expose analytics rollup → wire; drop mastery sample-badge.
- P4 — KB stubs: concept_edges / atomic_facts / notion_pages / pdf_sources reads (after backend P2/P3) → wire.
- P5 — polish: real Socratic tutor (MCP host / `window.claude`), search palette, manual capture entry.

## ¶O

- Backend deps block P2–P4. Owned by `../SPEC.md`: unfence analytics (backend T17), KB substrate models+migrations (T24), KB service seams (T26), retrieval+grounded gen (T28–T30). Desktop tasks here cite the missing endpoint, not the backend impl.
- Packaged-app CORS (`file://`) unresolved — dev only for now.
- Tutor chat = EmptyState ("MCP host pending", ¶T12); `TUTOR_MESSAGES` mock removed. Discriminator save already live.
- Session per-question outcome grid = EmptyState (no-endpoint badge): `sessions/{id}/summary` returns aggregates + flagged list, no per-attempt correctness array. Needs a backend per-attempt endpoint (future `../SPEC.md` task) to go live.

## ¶T

| id | st | goal | cites |
|----|----|------|-------|
| T1 | x | map `captures.topics` → node label in `adaptCaptures` (`firstTopicNodeId` reads node_id); flows now backend T38 returns `{node_id,name,path,kind}` (¶B1,¶V10) | V3,V9,backend-T38 |
| T2 | x | session node attribution live from `…/sessions/{id}/summary` `by_topic` → counts/accuracy/flagged/coverage + Node-coverage MasteryBars (V-O1 rollup). Per-question grid stays sampled+badged — no per-attempt feed (¶O) | V3,V7,backend-T38 |
| T3 | x | settings connections live: API+DB from `/tutor/healthz`; AnkiConnect/OpenAI/Notion real reachability from `GET /admin/status` (backend T39, `{configured,reachable,detail}`); via `loadSystemStatus`+useAsync (settleAll). MCP=token-presence, Chrome ext=inbound (no probe → "unknown", ¶V1) | V3,V7,backend-T39 |
| T4 | x | add typed `useAsync` + per-view loading skeletons; per-domain failure isolated (`allSettled`) ⊥ block app | V2,V7 |
| T5 | x | Review: live `picked`/`distribution`/`pastAttempts` from `by-qid` (`answer_distribution`+`picked`+`attempt_history`, backend T42). adaptChoices fixed to read `{key,plain}`. | V3,V6,backend-T42 |
| T6 | x | Anki: real `retention` (else `retrievability`) per card; per-day `reviewed_series` from `/anki/load-adherence` → `ANKI_LOAD` (backend T43). ⊥ lapse-derived/sampled. | V3,V6,backend-T43 |
| T7 | x | Mastery: `pseudoMastery` removed. Roots overlaid from `/outline/courses/{id}/mastery` at load; browsed subtree from `/outline/nodes/{id}/mastery` on select (backend T44). Unmeasured nodes = 0 (honest, ⊥ fabricated). Home badge → live. | V6,V9,V4,backend-T44 |
| T8 | x | Connections feed live: `CONNECTIONS` ← `concept_edges` read (`adaptEdges`); via=kind, score, recency from real edges. Home rail + Outline links tab; Session stat de-badged (no per-session attribution). dev rows via `seed_dev` KB-substrate. | V6,V9,V4,backend-T45 |
| T9 | x | Atomic facts live: `FACTS` ← `atomic_facts` read; FactsView + NodeFactsList + NodeDetail count + Review linked-facts (by-node) + PdfsView (per-pdf). `version` (extractor_version) is on `atomic_fact_tags` not the payload (§I) → "—" (⊥ fabricate). | V6,V9,V4,backend-T46 |
| T10 | x | Notion pages live: `NOTION_PAGES` ← `notion_pages` pointer index. `status` derived from `last_synced_at` (synced/pending); `block_count` unmodeled (§I) → "—". | V6,V9,V4,backend-T47 |
| T11 | x | PDFs live: `PDFS` ← `pdf_sources` inbox + per-pdf facts (filtered by filename stem). `pages`/`node` unmodeled (§I — pdf_sources course-scoped; facts carry node_id) → hidden/null. | V6,V9,V4,backend-T48 |
| T12 | . | Tutor chat: `TUTOR_MESSAGES` mock removed → EmptyState ("MCP host pending"). Wire real Socratic turn via MCP host / `window.claude`; keep discriminator save | V5 |
| T13 | x | `data/api.ts` extended with `getConceptEdges`/`getAtomicFacts`/`getNotionPages`/`getPdfSources` + raw types (`*Out`); adapters in `store.tsx`, ⊥ view-level fetch (Review by-node facts via `loadQuestion`). | V3 |
| T14 | x | audit (post T8–T11): no domain both live + sample-badged. Dropped stale P2 badges on NodeDetail facts, Session "new connections", Notion "blocks written". Discriminator-listing keeps (P2) — write-only, no read route. | V1,V9 |

## ¶B

| id | date | cause | fix |
| B1 | 2026-05-27 | ¶T1/¶T2 scoped "no backend change" but the fields they consume are empty TODO stubs in the backend — `captures.topics` always `[]` (`app/services/tutor/captures.py:30`), session `by_topic`/`top_topics` always `[]` (`sessions.py:85`), and summary has no per-attempt correctness array. Found at build plan time, not test time. | Added ¶V10 (verify payload populated before tagging no-backend). Client adapter `firstTopicNodeId` made forward-compatible (accepts id / `{node_id}` / `{id}`); ¶T1 held at `~`. Backend surfacing tracked in `../SPEC.md` T38. ¶T1/¶T2 cites now flag `?backend-T38`. |
| B2 | 2026-05-27 | Bundled mock (`data/mock.ts`) was both the store base AND the offline fallback (old ¶V2 "navigable on sample data"). User asked to remove all mock + build empty handlers; naive delete blanks/crashes every empty-or-offline surface (views index `db.X[0]`, `REVIEW_QUESTION.qid`, etc). | Deleted `data/mock.ts`; `baseDB` now empty; backed domains skeleton+empty-state, no-endpoint domains EmptyState, dead controls → no-op `StubButton`. Guards added where views derefed `[0]`/`find`. ¶G/¶C/¶V1/¶V2/¶V6/¶V9 amended; added ¶V11. ¶T8–¶T12 re-scoped sample→empty-state. |
|----|------|-------|-----|
