// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { buildNodeIndex, makeNodePath } from '../helpers'
import type { DB, OutlineNodeT, ReviewQuestionT, Tweaks } from '../types'

// The store is the seam: views read one composite DB + a status via useDB/useStore.
// Mock it so each test drives the views into a known empty / filled / async state
// without the network refresh machinery. vi.hoisted carries the mutable handles
// the (hoisted) vi.mock factory closes over.
const H = vi.hoisted(() => ({
  state: { db: null as unknown as DB, status: null as unknown as ReturnType<typeof makeStatus> },
  loadQuestion: vi.fn(),
  loadNodeMastery: vi.fn(),
  loadSessionSummary: vi.fn(),
  loadSystemStatus: vi.fn()
}))

vi.mock('../data/store', () => ({
  useDB: () => H.state.db,
  useStore: () => ({
    db: H.state.db,
    status: H.state.status,
    loadQuestion: H.loadQuestion,
    loadNodeMastery: H.loadNodeMastery,
    loadSessionSummary: H.loadSessionSummary,
    loadSystemStatus: H.loadSystemStatus,
    saveDiscriminator: vi.fn().mockResolvedValue(true),
    refresh: vi.fn(),
    createCourse: vi.fn(),
    importOutline: vi.fn()
  })
}))

import { ReviewView } from './Review'
import { OutlineView } from './Outline'
import { SettingsView, FactsView } from './Supporting'

const TWEAKS: Tweaks = { reviewLayout: 'docked', masteryViz: 'bars' }

function makeStatus(over: Partial<ReturnType<typeof base>> = {}) {
  function base() {
    return { online: false, loading: false, live: new Set<string>(), hasToken: false, apiBase: 'http://localhost:8000' }
  }
  return { ...base(), ...over }
}

const EMPTY_QUESTION: ReviewQuestionT = {
  qid: 0, source: '', testId: '', attemptedAt: '', timeSeconds: 0, node: 0, flagged: false,
  stem: '', choices: [], explanation: '', pastAttempts: [], tags: [], linkedAnki: [], linkedFacts: []
}

function emptyDB(): DB {
  return {
    COURSE: { id: 0, slug: '', name: '', shortName: '', abbr: '', nodeCount: 0, questionCount: 0, ankiCount: 0, factCount: 0, notionPageCount: 0 },
    OUTLINE: [], NODE_BY_ID: {}, nodePath: () => [],
    CAPTURES: [], REVIEW_QUESTION: { ...EMPTY_QUESTION }, ANKI_QUEUE: [], ANKI_LOAD: [],
    SESSIONS: [], PDFS: [], FACTS: [], NOTION_PAGES: [], CONNECTIONS: [], DISCRIMINATORS: [],
    TODAY: { date: '', flaggedCount: 0, needsReviewCount: 0, ankiDue: 0, ankiTarget: 0, ankiCompleted: 0, capturesAwaiting: 0, pdfNew: 0, newConnections: 0, activeNodes: [] }
  }
}

beforeEach(() => {
  H.state.db = emptyDB()
  H.state.status = makeStatus()
  H.loadQuestion.mockReset().mockResolvedValue(null)
  H.loadNodeMastery.mockReset().mockResolvedValue(null)
  H.loadSessionSummary.mockReset().mockResolvedValue(null)
  H.loadSystemStatus.mockReset().mockResolvedValue(null)
})
afterEach(cleanup)

// ─────────────────────────── Review ───────────────────────────
describe('ReviewView (¶V1/¶V2: navigable, never blank)', () => {
  it('empty base + offline → honest empty-state, ⊥ blank/sample question', () => {
    render(<ReviewView tweaks={TWEAKS} />)
    expect(screen.getByText('No question loaded')).toBeTruthy()
    expect(screen.getByText(/backend offline/)).toBeTruthy()
  })

  it('renders the question + choice grid from the store when offline (no fetch)', () => {
    H.state.db.REVIEW_QUESTION = {
      ...EMPTY_QUESTION, qid: 'q9', stem: 'What is the rate-limiting step?',
      choices: [
        { letter: 'A', text: 'Choice A', picked: false, correct: true, distribution: 0.7 },
        { letter: 'B', text: 'Choice B', picked: true, correct: false, distribution: 0.3 }
      ]
    }
    render(<ReviewView tweaks={TWEAKS} />)
    expect(screen.getByText('What is the rate-limiting step?')).toBeTruthy()
    expect(screen.getByText('Choice A')).toBeTruthy()
    expect(screen.getByText('Choice B')).toBeTruthy()
    expect(screen.getByText('Q · q9')).toBeTruthy()
    // offline → no live fetch attempted
    expect(H.loadQuestion).not.toHaveBeenCalled()
  })

  it('fetches the live question when online+token and renders it', async () => {
    H.state.status = makeStatus({ online: true, hasToken: true })
    H.state.db.REVIEW_QUESTION = { ...EMPTY_QUESTION, qid: 'q1' }
    H.loadQuestion.mockResolvedValue({
      ...EMPTY_QUESTION, qid: 'q1', stem: 'Live fetched stem',
      choices: [{ letter: 'A', text: 'Live choice', picked: false, correct: true, distribution: 1 }]
    })
    render(<ReviewView tweaks={TWEAKS} />)
    expect(H.loadQuestion).toHaveBeenCalledWith('q1')
    await waitFor(() => expect(screen.getByText('Live fetched stem')).toBeTruthy())
    expect(screen.getByText('Live choice')).toBeTruthy()
  })
})

// ─────────────────────────── Outline ───────────────────────────
describe('OutlineView', () => {
  const root: OutlineNodeT = { id: 1, parent: null, depth: 0, kind: 'section', name: 'Root Section', mastery: 0.5, items: 3 }
  const child: OutlineNodeT = { id: 2, parent: 1, depth: 1, kind: 'topic', name: 'Child Topic', mastery: 0, items: 1 }

  function withOutline() {
    const outline = [root, child]
    H.state.db.OUTLINE = outline
    H.state.db.NODE_BY_ID = buildNodeIndex(outline)
    H.state.db.nodePath = makeNodePath(H.state.db.NODE_BY_ID)
    H.state.db.COURSE = { ...H.state.db.COURSE, shortName: 'BIO', nodeCount: 2 }
  }

  it('empty outline → "No outline loaded" empty-state (⊥ crash on undefined sel)', () => {
    render(<OutlineView tweaks={TWEAKS} setView={vi.fn()} />)
    expect(screen.getByText('No outline loaded')).toBeTruthy()
  })

  it('renders the tree and lazily fetches the selected node mastery on mount', async () => {
    withOutline()
    render(<OutlineView tweaks={TWEAKS} setView={vi.fn()} />)
    expect(screen.getAllByText('Root Section').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Child Topic').length).toBeGreaterThan(0)
    // ¶T7: subtree mastery for the initially-selected root is fetched lazily.
    await waitFor(() => expect(H.loadNodeMastery).toHaveBeenCalledWith(1))
  })

  it('selecting a child node triggers a fresh mastery fetch for that node', async () => {
    withOutline()
    render(<OutlineView tweaks={TWEAKS} setView={vi.fn()} />)
    await waitFor(() => expect(H.loadNodeMastery).toHaveBeenCalledWith(1))
    fireEvent.click(screen.getAllByText('Child Topic')[0])
    await waitFor(() => expect(H.loadNodeMastery).toHaveBeenCalledWith(2))
  })
})

// ─────────────────────────── Supporting: Settings ───────────────────────────
describe('SettingsView', () => {
  it('renders the connection probes and stays navigable when the backend is offline (¶V2)', () => {
    render(<SettingsView setView={vi.fn()} />)
    expect(screen.getByText('Gradient API')).toBeTruthy()
    expect(screen.getByText('Postgres')).toBeTruthy()
    expect(screen.getByText('AnkiConnect')).toBeTruthy()
    expect(screen.getByText(/Unreachable/)).toBeTruthy()
    // offline → system-status probe not attempted
    expect(H.loadSystemStatus).not.toHaveBeenCalled()
  })

  it('probes system status when online+token', async () => {
    H.state.status = makeStatus({ online: true, hasToken: true, apiBase: 'http://localhost:8000' })
    H.loadSystemStatus.mockResolvedValue({
      dbReachable: true, attemptCount: 5,
      anki: { configured: true, reachable: true, detail: null },
      openai: { configured: true, reachable: true, detail: null },
      notion: { configured: false, reachable: false, detail: null }
    })
    render(<SettingsView setView={vi.fn()} />)
    await waitFor(() => expect(H.loadSystemStatus).toHaveBeenCalled())
    expect(screen.getByText('5 attempts recorded')).toBeTruthy()
  })

  it('exposes ONLY apiBase + coachToken as editable fields (¶V13)', () => {
    const { container } = render(<SettingsView setView={vi.fn()} />)
    expect(screen.getByText('X-Coach-Token')).toBeTruthy()
    expect(screen.getByText('API base URL')).toBeTruthy()
    // the two settable inputs and no more — OpenAI/Notion/Anki are backend-owned,
    // shown read-only in Connections, never editable here.
    expect(container.querySelectorAll('input').length).toBe(2)
  })
})

// ─────────────────────────── Supporting: Facts (no-endpoint badge) ───────────────────────────
describe('FactsView (¶V6: no fabricated measurements)', () => {
  it('no facts + no live domain → empty-state with "no endpoint" badge', () => {
    render(<FactsView />)
    expect(screen.getByText('No atomic facts')).toBeTruthy()
    expect(screen.getByText('no endpoint')).toBeTruthy()
  })

  it('clears the no-endpoint badge and lists facts once the domain is live', () => {
    H.state.status = makeStatus({ online: true, hasToken: true, live: new Set(['facts']) })
    H.state.db.NODE_BY_ID = { 7: { id: 7, parent: null, depth: 0, kind: 'topic', name: 'Tagged Node', mastery: 0, items: 1 } }
    H.state.db.FACTS = [{ id: 'f-1', text: 'A grounded fact', node: 7, pdf: 'source', page: 3, version: '—' }]
    render(<FactsView />)
    expect(screen.getByText('A grounded fact')).toBeTruthy()
    expect(screen.getByText('Tagged Node')).toBeTruthy()
    expect(screen.queryByText('no endpoint')).toBeNull()
    expect(screen.getByText('live')).toBeTruthy()
  })
})
