import { describe, it, expect } from 'vitest'

// store.tsx → api.ts → client.ts reads `window.gradient` at module load; the
// node test env has no window. Stub it before the dynamic import (a static
// import would be hoisted above this assignment and crash on `window`).
;(globalThis as { window?: unknown }).window ??= {
  gradient: { apiBase: 'http://localhost', coachToken: '', courseSlug: 'aamc' }
}

const { adaptSessions, adaptQuestion, adaptOutline, adaptSessionSummary } = await import('./store')

// ¶T15 / ¶V12 / ¶V6: neither RecentSession nor QuestionDetail carries a
// question-source field, so the adapters must not stamp a fabricated 'uworld'.
describe('source attribution — ⊥ fabricated uworld (¶V12, ¶V6)', () => {
  it('adaptSessions emits honest empty source (RecentSession has no source field)', () => {
    const out = adaptSessions([
      {
        test_id: 't1',
        attempt_count: 5,
        correct_count: 3,
        accuracy: 0.6,
        started_at: '2026-05-26T10:00:00Z',
        ended_at: '2026-05-26T11:00:00Z'
      }
    ])
    expect(out[0].source).not.toBe('uworld')
    expect(out[0].source).toBe('')
  })

  it('adaptQuestion emits honest empty source (QuestionDetail has no qbank field)', () => {
    const out = adaptQuestion(
      {
        qid: 'q1',
        question_id: 1,
        stem: 's',
        choices: [],
        correct_choice: null,
        explanation: null,
        tags: [],
        picked: null,
        answer_distribution: {},
        attempt_history: [],
        features: null
      },
      [],
      []
    )
    expect(out.source).not.toBe('uworld')
    expect(out.source).toBe('')
  })
})

// ¶T16 / ¶V12: the abbr chip must not be derived from a hardcoded AAMC
// section-name map. It rides the course's node payload (or none) — an
// AAMC-named root with no payload abbr yields undefined, ⊥ 'B/BC' etc.
describe('node abbr — ⊥ derived AAMC section literals (¶V12)', () => {
  const aamcRoot = {
    node_id: 1,
    parent_id: null,
    kind: 'section',
    name: 'Biological and Biochemical Foundations of Living Systems',
    depth: 0,
    position: 0
  }

  it('adaptOutline does not derive an abbr from an AAMC section name', () => {
    const [n] = adaptOutline({
      course: { id: 1, slug: 'aamc', name: 'MCAT', description: null },
      nodes: [aamcRoot]
    })
    expect(n.abbr).toBeUndefined()
  })

  it('adaptOutline passes through a course-supplied payload abbr', () => {
    const [n] = adaptOutline({
      course: { id: 1, slug: 'aamc', name: 'MCAT', description: null },
      nodes: [{ ...aamcRoot, abbr: 'B/BC' }]
    })
    expect(n.abbr).toBe('B/BC')
  })

  it('adaptSessionSummary does not derive an abbr from an AAMC topic name', () => {
    const out = adaptSessionSummary({
      test_id: 't1',
      attempt_count: 1,
      correct_count: 1,
      accuracy: 1,
      started_at: null,
      ended_at: null,
      by_topic: [
        {
          node_id: 1,
          name: 'Critical Analysis and Reasoning Skills',
          path: '/1',
          kind: 'section',
          attempt_count: 1,
          correct_count: 1,
          accuracy: 1
        }
      ],
      top_topics: [],
      flagged_attempts: [],
      notes: []
    })
    expect(out.byTopic[0].abbr).toBeUndefined()
  })
})
