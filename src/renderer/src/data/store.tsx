import React from 'react'
import * as API from './api'
import { ApiError, cfg } from './client'
import { settleAll } from './settle'
import { buildNodeIndex, makeNodePath } from '../helpers'
import type {
  DB, Course, OutlineNodeT, CaptureT, SessionT, AnkiCardT, ReviewQuestionT, ChoiceT, SessionDetailT,
  SystemStatusT, NodeMasteryT, TodayT, ConnectionT, FactT, NotionPageT, PdfT
} from '../types'

// ───────────────────────── empty base (⊥ mock) ─────────────────────────
// The store starts empty and overlays live API results per domain. Domains
// with no endpoint yet stay empty → views render an EmptyState. Offline = no
// overlay = empty (skeletons while loading, error surfaced by the view).
const EMPTY_COURSE: Course = {
  id: 0, slug: '', name: '', shortName: '', abbr: '',
  nodeCount: 0, questionCount: 0, ankiCount: 0, factCount: 0, notionPageCount: 0
}
const EMPTY_QUESTION: ReviewQuestionT = {
  qid: 0, source: '', testId: '', attemptedAt: '', timeSeconds: 0, node: 0, flagged: false,
  stem: '', choices: [], explanation: '', pastAttempts: [], tags: [], linkedAnki: [], linkedFacts: []
}
const EMPTY_TODAY: TodayT = {
  date: '', flaggedCount: 0, needsReviewCount: 0, ankiDue: 0, ankiTarget: 0, ankiCompleted: 0,
  capturesAwaiting: 0, pdfNew: 0, newConnections: 0, activeNodes: []
}

// Short attempt-history date: "Today" or "May 26".
function fmtAttemptDate(iso: string | null): string {
  if (!iso) return '—'
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  const d = new Date(t)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ───────────────────────── relative-time helper ─────────────────────────
function relTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  const s = Math.max(0, Math.round((Date.now() - t) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hr ago`
  const d = Math.round(h / 24)
  if (d === 1) return 'yesterday'
  return `${d}d ago`
}

function minutesBetween(a: string | null, b: string | null): string {
  if (!a || !b) return '—'
  const mins = Math.round((Date.parse(b) - Date.parse(a)) / 60000)
  if (!Number.isFinite(mins) || mins <= 0) return '—'
  if (mins < 60) return `${mins}m`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ${mins % 60}m`
  const d = Math.floor(mins / 1440)
  return `${d}d ${Math.round((mins % 1440) / 60)}h`
}

// ───────────────────────── adapters (API → DB shape) ─────────────────────────
export function adaptOutline(resp: API.OutlineTreeResp): OutlineNodeT[] {
  const kids = new Map<number, number[]>()
  for (const n of resp.nodes) {
    if (n.parent_id != null) {
      const arr = kids.get(n.parent_id) ?? []
      arr.push(n.node_id)
      kids.set(n.parent_id, arr)
    }
  }
  const descendantCount = (id: number): number => {
    const c = kids.get(id) ?? []
    return c.reduce((sum, k) => sum + 1 + descendantCount(k), 0)
  }
  return resp.nodes.map((n) => ({
    id: n.node_id,
    parent: n.parent_id,
    depth: n.depth,
    kind: n.kind,
    name: n.name,
    // Abbr rides the course's node payload, ⊥ a hardcoded section-name map
    // (¶V12). Backend doesn't surface it yet → undefined → no chip rendered.
    abbr: n.abbr,
    // real mastery overlaid from the course-mastery endpoint after load (¶T7);
    // 0 = no measured attempts yet (honest, ⊥ fabricated pseudo-value).
    mastery: 0,
    items: Math.max(1, descendantCount(n.node_id) || 1)
  }))
}

// Overlay accuracy from /outline/courses/{id}/mastery onto outline rows (¶T7).
// Course endpoint covers root nodes; deeper nodes fill in on-demand via
// loadNodeMastery when a subtree is browsed.
function applyMastery(outline: OutlineNodeT[], byId: Record<number, number>): OutlineNodeT[] {
  return outline.map((n) => (byId[n.id] != null ? { ...n, mastery: byId[n.id] } : n))
}

function adaptCaptures(rows: API.RecentCapture[]): CaptureT[] {
  return rows.map((r) => {
    const node = firstTopicNodeId(r.topics)
    const tagged = node != null
    return {
      id: `c-${r.attempt_id}`,
      source: r.uworld_test_id ? 'uworld' : 'manual',
      title: r.stem_preview ? `Q · ${r.qid} · ${r.stem_preview.slice(0, 28)}` : `Q · ${r.qid}`,
      // resolved to a node label in the view via NODE_BY_ID (¶T1)
      node,
      attemptedAt: relTime(r.attempted_at),
      isCorrect: r.is_correct,
      flagged: r.flagged,
      status: tagged ? 'categorized' : r.flagged ? 'needs-review' : 'uncategorized'
    }
  })
}

// Pull a node id out of a capture's `topics` entry. The backend payload shape
// here is not yet finalized (currently an empty list — see note in the build
// report), so accept the plausible forms: a bare node id, or an object
// carrying `node_id` / `id`. Returns null when no id is resolvable.
function firstTopicNodeId(topics: unknown): number | null {
  if (!Array.isArray(topics)) return null
  for (const t of topics) {
    if (typeof t === 'number' && Number.isFinite(t)) return t
    if (t && typeof t === 'object') {
      const o = t as Record<string, unknown>
      const id = o.node_id ?? o.id
      if (typeof id === 'number' && Number.isFinite(id)) return id
    }
  }
  return null
}

export function adaptSessionSummary(s: API.SessionSummary): SessionDetailT {
  return {
    testId: s.test_id,
    attempts: s.attempt_count,
    correct: s.correct_count,
    accuracy: s.accuracy,
    flaggedCount: s.flagged_attempts.length,
    // by_topic carries node label + per-node rollup (¶T2, V-O1) — feeds MasteryBars
    byTopic: s.by_topic.map((t) => ({
      id: t.node_id,
      name: t.name,
      mastery: t.accuracy,
      items: t.attempt_count,
      // course payload abbr, ⊥ derived section literals (¶V12)
      abbr: t.abbr
    })),
    topicCount: s.by_topic.length
  }
}

export function adaptSessions(rows: API.RecentSession[]): SessionT[] {
  return rows.map((r) => ({
    id: r.test_id,
    date: relTime(r.ended_at ?? r.started_at),
    items: r.attempt_count,
    correct: r.correct_count,
    time: minutesBetween(r.started_at, r.ended_at),
    // ¶T15: RecentSession carries no question-source field → honest unknown
    // (''), ⊥ fabricated 'uworld' (V12,V6). Course-level source name would ride
    // the course record once the backend surfaces it.
    source: '',
    node: 1
  }))
}

// ¶T8: concept_edges → connections feed. Edge endpoints already carry node
// names; NODE_BY_ID is a fallback. `via` = edge kind (similarity|manual).
function adaptEdges(rows: API.ConceptEdgeOut[], byId: Record<number, OutlineNodeT>): ConnectionT[] {
  const label = (e: { node_id: number; name: string | null }) =>
    e.name ?? byId[e.node_id]?.name ?? `node ${e.node_id}`
  return rows.map((e) => ({
    from: { kind: 'node', id: e.from.node_id, label: label(e.from) },
    to: { kind: 'node', id: e.to.node_id, label: label(e.to) },
    via: e.kind,
    node: e.from.node_id,
    when: relTime(e.created_at),
    score: e.score ?? undefined
  }))
}

// Filename without a trailing ".pdf" — views append/format the extension.
function pdfStem(name: string | null, fallbackId: number): string {
  if (!name) return `pdf ${fallbackId}`
  return name.replace(/\.pdf$/i, '')
}

// ¶T9: atomic_facts → FactT. `version` (extractor_version) lives on
// atomic_fact_tags, not the /atomic-facts payload (§I) → shown as "—".
function adaptFacts(rows: API.AtomicFactOut[]): FactT[] {
  return rows.map((f) => ({
    id: `f-${f.id}`,
    text: f.text,
    node: f.node_id ?? 0,
    pdf: pdfStem(f.pdf_source.filename, f.pdf_source.id),
    page: f.page ?? 0,
    version: '—'
  }))
}

// ¶T10: notion_pages pointer index → NotionPageT. `status` is derived from
// last_synced_at (no status column, §I); `blocks` (block_count) is not modeled
// → 0, rendered as "—" by the view (⊥ fabricate a count).
function adaptNotionPages(rows: API.NotionPageOut[], byId: Record<number, OutlineNodeT>): NotionPageT[] {
  return rows.map((p) => ({
    id: `np-${p.node_id}`,
    node: p.node_id,
    title: p.title ?? byId[p.node_id]?.name ?? `node ${p.node_id}`,
    blocks: 0,
    lastSynced: relTime(p.last_synced_at),
    status: p.last_synced_at ? 'synced' : 'pending',
    url: p.url ?? null
  }))
}

// ¶T11: pdf_sources inbox → PdfT. `pages` (page count) and per-PDF `node` are
// not modeled (§I — pdf_sources is course-scoped); pages → 0 (view shows "—"),
// node → null. `factsCount` is the route's atomic_facts rollup.
function adaptPdfs(rows: API.PdfSourceOut[]): PdfT[] {
  return rows.map((p) => ({
    id: `pdf-${p.id}`,
    filename: p.filename,
    pages: 0,
    status: p.status,
    factsCount: p.facts_count,
    ingestedAt: p.ingested_at ? relTime(p.ingested_at) : '—',
    node: null,
    sha: p.sha256
  }))
}

function adaptAnkiQueue(rows: API.AnkiCardOut[]): AnkiCardT[] {
  return rows.map((c) => {
    const firstField =
      c.fields_json && typeof c.fields_json === 'object'
        ? String(Object.values(c.fields_json)[0] ?? '').replace(/<[^>]+>/g, '').slice(0, 90)
        : ''
    const topicTag = c.tags.find((t) => t.topic_id != null)
    const lapses = c.lapses ?? 0
    // T43: real lifetime retention (else forgetting-curve retrievability);
    // lapse-derived only as a last resort when neither is present.
    const retention =
      c.retention ?? c.retrievability ?? Math.min(0.97, Math.max(0.4, 1 - lapses * 0.08))
    return {
      id: `ak-${c.anki_card_id}`,
      front: firstField || c.deck_name,
      node: topicTag?.topic_id ?? null,
      retention,
      interval: c.interval_days != null ? `${c.interval_days}d` : '—',
      due: c.queue === 1 || c.queue === 2 || c.queue === 3 ? 'due now' : relTime(c.due_date),
      lapses
    }
  })
}

function adaptChoices(
  raw: unknown,
  correct: string | null,
  distribution: Record<string, number>,
  picked: string | null
): ChoiceT[] {
  if (!Array.isArray(raw)) return []
  const total = Object.values(distribution).reduce((a, b) => a + b, 0)
  return raw.map((c: any, i: number) => {
    // stored choices are {key, html, plain}; tolerate label/letter/text too
    const letter = String(c?.key ?? c?.label ?? c?.letter ?? String.fromCharCode(65 + i))
    const text = typeof c === 'string' ? c : c?.plain ?? c?.text ?? c?.value ?? ''
    const count = distribution[letter] ?? 0
    return {
      letter,
      text,
      picked: picked != null && letter === String(picked),
      correct: correct != null && letter === String(correct),
      distribution: total ? count / total : 0
    }
  })
}

export function adaptQuestion(
  q: API.QuestionDetail,
  cards: API.AnkiCardOut[],
  facts: API.AtomicFactOut[] = []
): ReviewQuestionT {
  const tags = q.tags.map((t) => ({
    node: t.node_id,
    source: t.source,
    confidence: t.confidence ?? undefined
  }))
  const node = tags[0]?.node ?? 0
  const history = q.attempt_history ?? []
  return {
    qid: q.qid,
    questionId: q.question_id,
    // ¶T15: QuestionDetail carries no qbank source field (tags[].source is tag
    // provenance, not source) → honest unknown (''), ⊥ fabricated 'uworld'.
    source: '',
    testId: '—',
    attemptedAt: history[0] ? relTime(history[0].attempted_at) : '—',
    timeSeconds: history[0]?.time_seconds ?? 0,
    node,
    flagged: false,
    stem: q.stem,
    choices: adaptChoices(q.choices, q.correct_choice, q.answer_distribution ?? {}, q.picked ?? null),
    explanation: q.explanation ?? '',
    pastAttempts: history.map((a) => ({
      date: fmtAttemptDate(a.attempted_at),
      correct: a.is_correct,
      pick: a.selected_choice,
      time: a.time_seconds ?? 0
    })),
    tags,
    linkedAnki: adaptAnkiQueue(cards).map((c) => ({
      id: c.id,
      front: c.front,
      deck: 'Anki',
      retention: c.retention,
      interval: c.interval,
      due: c.due
    })),
    // ¶T9: atomic facts grounded to the question's node (by-node read).
    linkedFacts: facts.map((f) => ({
      id: `f-${f.id}`,
      text: f.text,
      pdf: pdfStem(f.pdf_source.filename, f.pdf_source.id),
      page: f.page ?? 0
    }))
  }
}

// ───────────────────────── store shape ─────────────────────────
export interface Status {
  online: boolean
  loading: boolean
  live: Set<string> // domains served by the live backend this session
  hasToken: boolean
  apiBase: string
}

export interface Store {
  db: DB
  status: Status
  refresh: () => void
  loadQuestion: (qid: string) => Promise<ReviewQuestionT | null>
  loadSessionSummary: (testId: string) => Promise<SessionDetailT | null>
  loadSystemStatus: () => Promise<SystemStatusT | null>
  loadNodeMastery: (nodeId: number) => Promise<NodeMasteryT | null>
  saveDiscriminator: (factor: string, questionId: number, nodeId?: number) => Promise<boolean>
  createCourse: (slug: string, name: string) => Promise<API.ApiCourse | null>
  importOutline: (courseId: number, schema: unknown) => Promise<boolean>
}

function baseDB(): DB {
  return {
    COURSE: EMPTY_COURSE,
    OUTLINE: [],
    NODE_BY_ID: {},
    nodePath: () => [],
    CAPTURES: [],
    REVIEW_QUESTION: EMPTY_QUESTION,
    ANKI_QUEUE: [],
    ANKI_LOAD: [],
    SESSIONS: [],
    PDFS: [],
    FACTS: [],
    NOTION_PAGES: [],
    CONNECTIONS: [],
    DISCRIMINATORS: [],
    TODAY: EMPTY_TODAY
  }
}

const StoreCtx = React.createContext<Store | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = React.useState<DB>(baseDB)
  const [status, setStatus] = React.useState<Status>({
    online: false,
    loading: true,
    live: new Set(),
    hasToken: !!cfg.coachToken,
    apiBase: cfg.apiBase
  })

  const refresh = React.useCallback(() => {
    let cancelled = false
    setStatus((s) => ({ ...s, loading: true }))

    async function run() {
      const live = new Set<string>()
      const next: DB = baseDB()
      let online = false

      // courses + outline (open routes, no token) ──────────────────────────
      try {
        const courses = await API.listCourses()
        online = true
        const course = courses.find((c) => c.slug === cfg.courseSlug) ?? courses[0]
        if (course) {
          live.add('course')
          try {
            const tree = await API.getOutlineTree(course.slug)
            const outline = adaptOutline(tree)
            if (outline.length) {
              const byId = buildNodeIndex(outline)
              next.OUTLINE = outline
              next.NODE_BY_ID = byId
              next.nodePath = makeNodePath(byId)
              live.add('outline')
              next.COURSE = {
                ...next.COURSE,
                id: course.id,
                slug: course.slug,
                name: course.name,
                shortName: course.slug.toUpperCase(),
                abbr: course.slug.slice(0, 2).toUpperCase(),
                nodeCount: outline.length
              }
              // ¶T7: overlay real per-root mastery (course endpoint, open route)
              try {
                const cm = await API.getCourseMastery(course.id)
                if (cm.nodes.length) {
                  const m: Record<number, number> = {}
                  for (const n of cm.nodes) m[n.node_id] = n.accuracy
                  const withMastery = applyMastery(outline, m)
                  next.OUTLINE = withMastery
                  next.NODE_BY_ID = buildNodeIndex(withMastery)
                  next.nodePath = makeNodePath(next.NODE_BY_ID)
                  live.add('mastery')
                }
              } catch { /* keep 0-mastery */ }
            }
          } catch { /* keep mock outline */ }
        }
      } catch { /* backend down — stay on mock, online=false */ }

      // token-gated reads — concurrent + isolated (¶V7): one failing read
      // never drops the others (settleAll maps rejected → undefined).
      if (online && cfg.coachToken) {
        const r = await settleAll({
          flagged: API.getFlagged(20),
          sessions: API.getRecentSessions(5),
          captures: API.getRecentCaptures(8),
          ankiQ: API.getAnkiReviewQueue(),
          loadCfg: API.getLoadConfig(),
          adherence: API.getLoadAdherence(),
          edges: API.getConceptEdges({ limit: 50 }),
          facts: API.getAtomicFacts({ limit: 200 }),
          notionPages: API.getNotionPages(),
          pdfs: API.getPdfSources()
        })
        if (r.flagged) {
          live.add('flagged')
          next.TODAY = { ...next.TODAY, flaggedCount: r.flagged.length }
        }
        // Reachable-but-empty (`[]`) is real data → overlay it (empty state),
        // ⊥ keep mock. Mock fallback applies only when the read FAILED
        // (settleAll → undefined), not when the backend legitimately returns
        // nothing. Distinguishes empty-live from offline (¶V1/¶V2).
        if (r.sessions !== undefined) {
          live.add('sessions')
          next.SESSIONS = adaptSessions(r.sessions)
        }
        if (r.captures !== undefined) {
          live.add('captures')
          next.CAPTURES = adaptCaptures(r.captures)
          next.TODAY = {
            ...next.TODAY,
            capturesAwaiting: next.CAPTURES.filter((c) => c.status === 'uncategorized').length
          }
        }
        if (r.ankiQ !== undefined) {
          live.add('anki')
          next.ANKI_QUEUE = adaptAnkiQueue(r.ankiQ)
          next.TODAY = { ...next.TODAY, ankiDue: r.ankiQ.length }
        }
        if (r.loadCfg) {
          live.add('anki-load')
          next.TODAY = { ...next.TODAY, ankiTarget: r.loadCfg.daily_card_review_budget }
        }
        // T43: real per-day reviewed series + today's reviewed count.
        // Fetched (even empty) is live data → ⊥ keep mock series/completed.
        if (r.adherence !== undefined) {
          live.add('anki-series')
          const series = r.adherence?.reviewed_series ?? []
          next.ANKI_LOAD = series.map((d) => d.reviewed)
          next.TODAY = {
            ...next.TODAY,
            ankiCompleted: series.length ? series[series.length - 1].reviewed : 0
          }
        }
        // Review resume target: point at a REAL qid (flagged, else recent
        // capture) so by-qid resolves live — ⊥ the hardcoded mock qid (404).
        const resumeQid = r.flagged?.[0]?.qid ?? r.captures?.[0]?.qid
        if (resumeQid) {
          live.add('review')
          next.REVIEW_QUESTION = { ...next.REVIEW_QUESTION, qid: resumeQid }
        }
        // ¶T8: concept_edges feed (live, even when empty → ⊥ keep mock).
        if (r.edges !== undefined) {
          live.add('connections')
          next.CONNECTIONS = adaptEdges(r.edges, next.NODE_BY_ID)
          next.TODAY = { ...next.TODAY, newConnections: r.edges.length }
        }
        // ¶T9: atomic_facts feed (live, even when empty → ⊥ keep mock).
        if (r.facts !== undefined) {
          live.add('facts')
          next.FACTS = adaptFacts(r.facts)
          next.COURSE = { ...next.COURSE, factCount: r.facts.length }
        }
        // ¶T10: notion_pages pointer index (live, even when empty → ⊥ keep mock).
        if (r.notionPages !== undefined) {
          live.add('notion')
          next.NOTION_PAGES = adaptNotionPages(r.notionPages, next.NODE_BY_ID)
          next.COURSE = { ...next.COURSE, notionPageCount: r.notionPages.length }
        }
        // ¶T11: pdf_sources inbox (live, even when empty → ⊥ keep mock).
        if (r.pdfs !== undefined) {
          live.add('pdfs')
          next.PDFS = adaptPdfs(r.pdfs)
          next.TODAY = { ...next.TODAY, pdfNew: r.pdfs.length }
        }
      }

      if (!cancelled) {
        setDb(next)
        setStatus({
          online,
          loading: false,
          live,
          hasToken: !!cfg.coachToken,
          apiBase: cfg.apiBase
        })
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  React.useEffect(() => { refresh() }, [refresh])

  const loadQuestion = React.useCallback(async (qid: string) => {
    try {
      const q = await API.getQuestionByQid(qid)
      let cards: API.AnkiCardOut[] = []
      try { cards = await API.getCardsByQid(qid) } catch { /* ok */ }
      // ¶T9: linked atomic facts grounded to the question's primary node.
      let facts: API.AtomicFactOut[] = []
      const nodeId = q.tags[0]?.node_id
      if (nodeId != null) {
        try { facts = await API.getAtomicFacts({ node_id: nodeId, limit: 8 }) } catch { /* ok */ }
      }
      return adaptQuestion(q, cards, facts)
    } catch {
      return null
    }
  }, [])

  const loadSessionSummary = React.useCallback(async (testId: string) => {
    try {
      return adaptSessionSummary(await API.getSessionSummary(testId))
    } catch {
      return null
    }
  }, [])

  const loadSystemStatus = React.useCallback(async (): Promise<SystemStatusT | null> => {
    // ¶V7: healthz (DB) + admin/status (service probes, backend T39) isolated —
    // one failing read still yields the other.
    const r = await settleAll({ health: API.getTutorHealthz(), status: API.getSystemStatus() })
    if (!r.health && !r.status) return null
    const offline = { configured: false, reachable: false, detail: null }
    return {
      dbReachable: r.health?.db_reachable ?? false,
      attemptCount: r.health?.attempt_count ?? 0,
      anki: r.status?.anki ?? offline,
      openai: r.status?.openai ?? offline,
      notion: r.status?.notion ?? offline
    }
  }, [])

  const loadNodeMastery = React.useCallback(async (nodeId: number): Promise<NodeMasteryT | null> => {
    try {
      const m = await API.getNodeMastery(nodeId)
      const byId: Record<number, number> = { [m.node.id]: m.rollup.accuracy }
      for (const c of m.children) byId[c.node_id] = c.accuracy
      return { nodeId: m.node.id, accuracy: m.rollup.accuracy, byId }
    } catch {
      return null
    }
  }, [])

  const saveDiscriminator = React.useCallback(
    async (factor: string, questionId: number, nodeId?: number) => {
      try {
        await API.saveDiscriminator(questionId, factor, nodeId)
        return true
      } catch (e) {
        return e instanceof ApiError && e.status === 409 // dedup = already saved
      }
    },
    []
  )

  const createCourse = React.useCallback(async (slug: string, name: string) => {
    try { return await API.createCourse(slug, name) } catch { return null }
  }, [])

  const importOutline = React.useCallback(async (courseId: number, schema: unknown) => {
    try { await API.importOutline(courseId, schema); refresh(); return true } catch { return false }
  }, [refresh])

  const store: Store = {
    db, status, refresh, loadQuestion, loadSessionSummary, loadSystemStatus, loadNodeMastery,
    saveDiscriminator, createCourse, importOutline
  }
  return <StoreCtx.Provider value={store}>{children}</StoreCtx.Provider>
}

export function useStore(): Store {
  const s = React.useContext(StoreCtx)
  if (!s) throw new Error('useStore must be used within StoreProvider')
  return s
}

// Convenience: most views only need the data object.
export function useDB(): DB {
  return useStore().db
}
