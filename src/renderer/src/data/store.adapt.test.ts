import { describe, it, expect } from 'vitest'

// store.tsx → api.ts → client.ts reads `window.gradient` at module load; the
// node test env has no window. Stub it before the dynamic import (a static
// import would be hoisted above this assignment and crash on `window`).
;(globalThis as { window?: unknown }).window ??= {
  gradient: { apiBase: 'http://localhost', coachToken: '', courseSlug: 'aamc' }
}

const { adaptSessions, adaptQuestion } = await import('./store')

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
