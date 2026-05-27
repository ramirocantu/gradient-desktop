import React from 'react'
import * as mock from './mock'
import * as API from './api'
import { ApiError, cfg } from './client'
import { settleAll } from './settle'
import { buildNodeIndex, makeNodePath, deriveAbbr } from '../helpers'
import type {
  DB, OutlineNodeT, CaptureT, SessionT, AnkiCardT, ReviewQuestionT, ChoiceT, SessionDetailT,
  SystemStatusT, NodeMasteryT
} from '../types'

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
  return Number.isFinite(mins) && mins > 0 ? `${mins}m` : '—'
}

// ───────────────────────── adapters (API → DB shape) ─────────────────────────
function adaptOutline(resp: API.OutlineTreeResp): OutlineNodeT[] {
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
    abbr: n.depth === 0 ? deriveAbbr(n.name) : undefined,
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

function adaptSessionSummary(s: API.SessionSummary): SessionDetailT {
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
      abbr: deriveAbbr(t.name)
    })),
    topicCount: s.by_topic.length
  }
}

function adaptSessions(rows: API.RecentSession[]): SessionT[] {
  return rows.map((r) => ({
    id: r.test_id,
    date: relTime(r.ended_at ?? r.started_at),
    items: r.attempt_count,
    correct: r.correct_count,
    time: minutesBetween(r.started_at, r.ended_at),
    source: 'uworld',
    node: 1
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
  if (!Array.isArray(raw)) return mock.REVIEW_QUESTION.choices
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

function adaptQuestion(
  q: API.QuestionDetail,
  cards: API.AnkiCardOut[]
): ReviewQuestionT {
  const tags = q.tags.map((t) => ({
    node: t.node_id,
    source: t.source,
    confidence: t.confidence ?? undefined
  }))
  const node = tags[0]?.node ?? mock.REVIEW_QUESTION.node
  const history = q.attempt_history ?? []
  return {
    qid: q.qid,
    questionId: q.question_id,
    source: 'uworld',
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
    linkedFacts: [] // atomic facts are P2 (no endpoint)
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
  const byId = buildNodeIndex(mock.OUTLINE)
  return {
    COURSE: mock.COURSE,
    OUTLINE: mock.OUTLINE,
    NODE_BY_ID: byId,
    nodePath: makeNodePath(byId),
    CAPTURES: mock.CAPTURES,
    REVIEW_QUESTION: mock.REVIEW_QUESTION,
    ANKI_QUEUE: mock.ANKI_QUEUE,
    ANKI_LOAD: mock.ANKI_LOAD,
    SESSIONS: mock.SESSIONS,
    PDFS: mock.PDFS,
    FACTS: mock.FACTS,
    NOTION_PAGES: mock.NOTION_PAGES,
    CONNECTIONS: mock.CONNECTIONS,
    DISCRIMINATORS: mock.DISCRIMINATORS,
    TODAY: mock.TODAY
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
          adherence: API.getLoadAdherence()
        })
        if (r.flagged) {
          live.add('flagged')
          next.TODAY = { ...next.TODAY, flaggedCount: r.flagged.length }
        }
        if (r.sessions?.length) {
          live.add('sessions')
          next.SESSIONS = adaptSessions(r.sessions)
        }
        if (r.captures?.length) {
          live.add('captures')
          next.CAPTURES = adaptCaptures(r.captures)
          next.TODAY = {
            ...next.TODAY,
            capturesAwaiting: next.CAPTURES.filter((c) => c.status === 'uncategorized').length
          }
        }
        if (r.ankiQ?.length) {
          live.add('anki')
          next.ANKI_QUEUE = adaptAnkiQueue(r.ankiQ)
          next.TODAY = { ...next.TODAY, ankiDue: r.ankiQ.length }
        }
        if (r.loadCfg) {
          live.add('anki-load')
          next.TODAY = { ...next.TODAY, ankiTarget: r.loadCfg.daily_card_review_budget }
        }
        // T43: real per-day reviewed series for the adherence chart
        if (r.adherence?.reviewed_series?.length) {
          live.add('anki-series')
          next.ANKI_LOAD = r.adherence.reviewed_series.map((d) => d.reviewed)
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
      return adaptQuestion(q, cards)
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
