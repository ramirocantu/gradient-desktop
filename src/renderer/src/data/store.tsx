import React from 'react'
import * as mock from './mock'
import * as API from './api'
import { ApiError, cfg } from './client'
import { settleAll } from './settle'
import { buildNodeIndex, makeNodePath, pseudoMastery, deriveAbbr } from '../helpers'
import type {
  DB, OutlineNodeT, CaptureT, SessionT, AnkiCardT, ReviewQuestionT, ChoiceT
} from '../types'

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
    // analytics/mastery is FENCED (no per-node mastery endpoint yet) — stable
    // pseudo-value so the viz renders; swap for a real read when it lands.
    mastery: pseudoMastery(n.node_id),
    items: Math.max(1, descendantCount(n.node_id) || 1)
  }))
}

function adaptCaptures(rows: API.RecentCapture[]): CaptureT[] {
  return rows.map((r) => {
    const tagged = Array.isArray(r.topics) && r.topics.length > 0
    return {
      id: `c-${r.attempt_id}`,
      source: r.uworld_test_id ? 'uworld' : 'manual',
      title: r.stem_preview ? `Q · ${r.qid} · ${r.stem_preview.slice(0, 28)}` : `Q · ${r.qid}`,
      node: null,
      attemptedAt: relTime(r.attempted_at),
      isCorrect: r.is_correct,
      flagged: r.flagged,
      status: tagged ? 'categorized' : r.flagged ? 'needs-review' : 'uncategorized'
    }
  })
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
    return {
      id: `ak-${c.anki_card_id}`,
      front: firstField || c.deck_name,
      node: topicTag?.topic_id ?? null,
      // no retention column exposed; degrade from lapse count for the viz pill
      retention: Math.min(0.97, Math.max(0.4, 1 - lapses * 0.08)),
      interval: c.interval_days != null ? `${c.interval_days}d` : '—',
      due: c.queue === 1 || c.queue === 2 || c.queue === 3 ? 'due now' : relTime(c.due_date),
      lapses
    }
  })
}

function adaptChoices(raw: unknown, correct: string | null): ChoiceT[] {
  if (!Array.isArray(raw)) return mock.REVIEW_QUESTION.choices
  return raw.map((c: any, i: number) => {
    const letter = c?.label ?? c?.letter ?? String.fromCharCode(65 + i)
    const text = typeof c === 'string' ? c : c?.text ?? c?.value ?? ''
    return {
      letter,
      text,
      picked: false,
      correct: correct != null && String(letter) === String(correct),
      distribution: 0
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
  return {
    qid: q.qid,
    questionId: q.question_id,
    source: 'uworld',
    testId: '—',
    attemptedAt: '—',
    timeSeconds: 0,
    node,
    flagged: false,
    stem: q.stem,
    choices: adaptChoices(q.choices, q.correct_choice),
    explanation: q.explanation ?? '',
    pastAttempts: [], // no attempt-history endpoint yet
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
          loadCfg: API.getLoadConfig()
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
    db, status, refresh, loadQuestion, saveDiscriminator, createCourse, importOutline
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
