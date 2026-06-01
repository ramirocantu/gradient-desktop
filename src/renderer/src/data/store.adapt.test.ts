import { describe, it, expect } from 'vitest'

// store.tsx → api.ts → client.ts reads `window.gradient` at module load; the
// node test env has no window. Stub it before the dynamic import (a static
// import would be hoisted above this assignment and crash on `window`).
;(globalThis as { window?: unknown }).window ??= {
  gradient: { apiBase: 'http://localhost', coachToken: '', courseSlug: 'aamc' }
}

const {
  adaptSessions, adaptQuestion, adaptOutline, adaptSessionSummary,
  adaptChoices, adaptEdges, adaptFacts, adaptNotionPages, adaptPdfs,
  adaptAnkiQueue, adaptCaptures
} = await import('./store')

// A minimal QuestionDetail the adapter accepts; spread overrides per test.
const baseQuestion = {
  qid: 'q1', question_id: 1, stem: 's', choices: [] as unknown, correct_choice: null as string | null,
  explanation: null as string | null, tags: [] as { node_id: number; source: string; confidence: number | null; rationale: string | null; manual_review: boolean }[],
  picked: null as string | null, answer_distribution: {} as Record<string, number>,
  attempt_history: [] as { attempted_at: string | null; is_correct: boolean; selected_choice: string; time_seconds: number | null }[],
  features: null
}

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

// adaptChoices tolerates several stored answer shapes (the backend has stored
// {key,html,plain}, {letter,text}, and bare strings over time).
describe('adaptChoices — multiple stored formats', () => {
  it('non-array input → [] (⊥ throw on null/object)', () => {
    expect(adaptChoices(null, null, {}, null)).toEqual([])
    expect(adaptChoices(undefined, null, {}, null)).toEqual([])
    expect(adaptChoices({ a: 1 }, null, {}, null)).toEqual([])
  })

  it('reads letter from key|label|letter, text from plain|text|value', () => {
    const out = adaptChoices(
      [{ key: 'A', plain: 'alpha' }, { label: 'B', text: 'beta' }, { letter: 'C', value: 'gamma' }],
      null, {}, null
    )
    expect(out.map((c) => [c.letter, c.text])).toEqual([['A', 'alpha'], ['B', 'beta'], ['C', 'gamma']])
  })

  it('bare strings → A/B/C letters by index, string is the text', () => {
    const out = adaptChoices(['first', 'second'], null, {}, null)
    expect(out.map((c) => [c.letter, c.text])).toEqual([['A', 'first'], ['B', 'second']])
  })

  it('flags the picked + correct letters (string-compared)', () => {
    const out = adaptChoices([{ key: 'A' }, { key: 'B' }, { key: 'C' }], 'C', {}, 'A')
    expect(out.find((c) => c.letter === 'A')).toMatchObject({ picked: true, correct: false })
    expect(out.find((c) => c.letter === 'C')).toMatchObject({ picked: false, correct: true })
    expect(out.find((c) => c.letter === 'B')).toMatchObject({ picked: false, correct: false })
  })

  it('distribution is each choice count over the total', () => {
    const out = adaptChoices([{ key: 'A' }, { key: 'B' }], null, { A: 3, B: 1 }, null)
    expect(out[0].distribution).toBeCloseTo(0.75)
    expect(out[1].distribution).toBeCloseTo(0.25)
  })

  it('zero-total distribution → 0 (⊥ NaN/divide-by-zero)', () => {
    const out = adaptChoices([{ key: 'A' }], null, {}, null)
    expect(out[0].distribution).toBe(0)
  })
})

// adaptQuestion merges tags + attempt history + linked Anki/facts.
describe('adaptQuestion — tag/attempt/linked merge', () => {
  it('primary node comes from the first tag (else 0)', () => {
    const tagged = adaptQuestion(
      { ...baseQuestion, tags: [{ node_id: 7, source: 'llm', confidence: 0.9, rationale: null, manual_review: false }] }, [], []
    )
    expect(tagged.node).toBe(7)
    expect(tagged.tags[0]).toEqual({ node: 7, source: 'llm', confidence: 0.9 })
    expect(adaptQuestion(baseQuestion, [], []).node).toBe(0)
  })

  it('maps attempt history into pastAttempts (pick/correct/time)', () => {
    const out = adaptQuestion(
      { ...baseQuestion, attempt_history: [{ attempted_at: null, is_correct: false, selected_choice: 'B', time_seconds: 42 }] }, [], []
    )
    expect(out.pastAttempts).toEqual([{ date: '—', correct: false, pick: 'B', time: 42 }])
  })

  it('builds choices via adaptChoices and surfaces the picked/correct letters', () => {
    const out = adaptQuestion(
      { ...baseQuestion, choices: [{ key: 'A', plain: 'x' }, { key: 'B', plain: 'y' }], correct_choice: 'A', picked: 'B' }, [], []
    )
    expect(out.choices.map((c) => c.text)).toEqual(['x', 'y'])
    expect(out.choices[0].correct).toBe(true)
    expect(out.choices[1].picked).toBe(true)
  })

  it('links Anki cards and grounded atomic facts', () => {
    const out = adaptQuestion(
      baseQuestion,
      [{ anki_card_id: 5, deck_name: 'D', fields_json: { Front: 'card front' }, interval_days: 3, retention: 0.8, retrievability: null, lapses: 0, id: 5, note_id: null, model_name: null, due_date: null, ease: null, queue: null, sync_at: '', tags: [] }],
      [{ id: 9, text: 'fact', node_id: 7, page: 4, pdf_source: { id: 2, filename: 'src.pdf' }, created_at: '' }]
    )
    expect(out.linkedAnki[0]).toMatchObject({ id: 'ak-5', front: 'card front', deck: 'Anki' })
    expect(out.linkedFacts[0]).toEqual({ id: 'f-9', text: 'fact', pdf: 'src', page: 4 })
  })
})

// ¶T8: concept_edges → connections feed.
describe('adaptEdges', () => {
  const byId = { 1: { id: 1, parent: null, depth: 0, kind: 'topic', name: 'From node', mastery: 0, items: 1 } }
  it('prefers the edge-supplied name, falls back to the node index then a stub', () => {
    const out = adaptEdges(
      [{ id: 1, from: { node_id: 1, name: null }, to: { node_id: 2, name: 'To node' }, kind: 'similarity', score: 0.5, created_at: null as unknown as string }],
      byId as never
    )
    expect(out[0].from.label).toBe('From node') // from byId (edge name null)
    expect(out[0].to.label).toBe('To node') // from edge payload
    expect(out[0].via).toBe('similarity')
    expect(out[0].score).toBe(0.5)
  })

  it('unknown node with no name → "node N" stub; null score → undefined', () => {
    const out = adaptEdges(
      [{ id: 2, from: { node_id: 99, name: null }, to: { node_id: 98, name: null }, kind: 'manual', score: null, created_at: null as unknown as string }],
      {} as never
    )
    expect(out[0].from.label).toBe('node 99')
    expect(out[0].score).toBeUndefined()
  })
})

// ¶T9: atomic_facts → FactT. version is never fabricated (lives on tags, §I).
describe('adaptFacts (¶V6)', () => {
  it('strips the .pdf extension, defaults page, ⊥ fabricated version', () => {
    const out = adaptFacts([
      { id: 3, text: 'a fact', node_id: 7, page: null, pdf_source: { id: 1, filename: 'Lecture.PDF' }, created_at: '' }
    ])
    expect(out[0]).toEqual({ id: 'f-3', text: 'a fact', node: 7, pdf: 'Lecture', page: 0, version: '—' })
  })

  it('null node_id → 0; null filename → "pdf <id>"', () => {
    const out = adaptFacts([
      { id: 4, text: 't', node_id: null, page: 2, pdf_source: { id: 9, filename: null }, created_at: '' }
    ])
    expect(out[0]).toMatchObject({ node: 0, pdf: 'pdf 9', page: 2 })
  })

  it('empty input → []', () => {
    expect(adaptFacts([])).toEqual([])
  })
})

// ¶T10: notion_pages pointer index. blocks is never fabricated (not modeled, §I).
describe('adaptNotionPages (¶V6)', () => {
  const byId = { 5: { id: 5, parent: null, depth: 0, kind: 'topic', name: 'Node Five', mastery: 0, items: 1 } }
  it('synced when last_synced_at present; title falls back to node name', () => {
    const out = adaptNotionPages(
      [{ node_id: 5, title: null, url: 'http://n', notion_page_id: 'p1', tags: null, last_synced_at: '2026-05-01T00:00:00Z' }],
      byId as never
    )
    expect(out[0]).toMatchObject({ id: 'np-5', node: 5, title: 'Node Five', blocks: 0, status: 'synced', url: 'http://n' })
  })

  it('pending when never synced; title stub when node unknown', () => {
    const out = adaptNotionPages(
      [{ node_id: 8, title: null, url: null as unknown as string, notion_page_id: 'p2', tags: null, last_synced_at: null }],
      {} as never
    )
    expect(out[0]).toMatchObject({ status: 'pending', title: 'node 8', url: null })
  })
})

// ¶T11: pdf_sources inbox. pages/node are not modeled → 0/null, never fabricated.
describe('adaptPdfs (¶V6)', () => {
  it('passes status + facts rollup; pages 0 and node null (not modeled)', () => {
    const out = adaptPdfs([
      { id: 2, filename: 'a.pdf', sha256: 'abc', status: 'ingested', facts_count: 12, course_id: 1, ingested_at: null, created_at: '' }
    ])
    expect(out[0]).toMatchObject({ id: 'pdf-2', filename: 'a.pdf', pages: 0, node: null, status: 'ingested', factsCount: 12, sha: 'abc', ingestedAt: '—' })
  })
})

// adaptAnkiQueue retention precedence: real retention > retrievability > lapse curve.
describe('adaptAnkiQueue — retention fallback (T43)', () => {
  const card = (over: Record<string, unknown>) => ({
    id: 1, anki_card_id: 1, deck_name: 'Deck', note_id: null, model_name: null,
    fields_json: null as Record<string, unknown> | null, due_date: null, interval_days: null,
    ease: null, lapses: null as number | null, queue: null as number | null, sync_at: '',
    tags: [] as { tag_raw: string; parsed_kind: string; topic_id: number | null; question_qid: string | null }[],
    retention: null as number | null, retrievability: null as number | null, ...over
  })

  it('uses real lifetime retention when present', () => {
    expect(adaptAnkiQueue([card({ retention: 0.83 })])[0].retention).toBeCloseTo(0.83)
  })

  it('falls back to retrievability when retention is absent', () => {
    expect(adaptAnkiQueue([card({ retention: null, retrievability: 0.66 })])[0].retention).toBeCloseTo(0.66)
  })

  it('lapse-derived curve only as a last resort', () => {
    expect(adaptAnkiQueue([card({ lapses: 5 })])[0].retention).toBeCloseTo(0.6) // 1 - 5*0.08
  })

  it('pulls node from the first topic-tagged tag, strips HTML from the front field', () => {
    const out = adaptAnkiQueue([card({
      fields_json: { Front: '<b>front</b> text' },
      tags: [{ tag_raw: 't', parsed_kind: 'topic', topic_id: 42, question_qid: null }],
      queue: 1
    })])
    expect(out[0].node).toBe(42)
    expect(out[0].front).toBe('front text')
    expect(out[0].due).toBe('due now') // queue 1/2/3 = due
  })
})

// adaptCaptures: firstTopicNodeId extraction + source/status derivation.
describe('adaptCaptures — firstTopicNodeId + status', () => {
  const cap = (over: Record<string, unknown>) => ({
    attempt_id: 1, question_id: 1, qid: 'q1', stem_preview: 'stem', attempted_at: '2026-05-01T00:00:00Z',
    is_correct: null as boolean | null, selected_choice: null, flagged: false,
    uworld_test_id: null as string | null, topics: [] as unknown[], notes: [], ...over
  })

  it('extracts a node id from a bare number, {node_id}, or {id} topic entry', () => {
    expect(adaptCaptures([cap({ topics: [3] })])[0].node).toBe(3)
    expect(adaptCaptures([cap({ topics: [{ node_id: 4 }] })])[0].node).toBe(4)
    expect(adaptCaptures([cap({ topics: [{ id: 5 }] })])[0].node).toBe(5)
  })

  it('no resolvable topic id → node null', () => {
    expect(adaptCaptures([cap({ topics: [] })])[0].node).toBeNull()
    expect(adaptCaptures([cap({ topics: [{ foo: 1 }] })])[0].node).toBeNull()
  })

  it('source is uworld only when a uworld_test_id is present, else manual', () => {
    expect(adaptCaptures([cap({ uworld_test_id: 'UW-1' })])[0].source).toBe('uworld')
    expect(adaptCaptures([cap({ uworld_test_id: null })])[0].source).toBe('manual')
  })

  it('status: tagged → categorized, untagged+flagged → needs-review, else uncategorized', () => {
    expect(adaptCaptures([cap({ topics: [3] })])[0].status).toBe('categorized')
    expect(adaptCaptures([cap({ topics: [], flagged: true })])[0].status).toBe('needs-review')
    expect(adaptCaptures([cap({ topics: [], flagged: false })])[0].status).toBe('uncategorized')
  })
})
