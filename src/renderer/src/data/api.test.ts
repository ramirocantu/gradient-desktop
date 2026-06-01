import { describe, it, expect, vi, beforeEach } from 'vitest'

// api.ts is a thin typed layer over client.ts's `api()`. Mock the wrapper so the
// tests assert the CONTRACT each endpoint fn emits — path, query, method, body —
// without a live backend (and without client.ts touching `window` at load).
vi.mock('./client', () => ({ api: vi.fn() }))

import * as API from './api'
import { api } from './client'

const mockApi = vi.mocked(api)

beforeEach(() => {
  mockApi.mockReset()
  mockApi.mockResolvedValue(undefined as never)
})

// Last (path, opts) the endpoint fn handed to the client wrapper.
const lastCall = () => mockApi.mock.calls[mockApi.mock.calls.length - 1]

describe('reads — path + query construction', () => {
  it('listCourses → bare path, no opts', () => {
    API.listCourses()
    expect(lastCall()).toEqual(['/api/v1/courses'])
  })

  it('getOutlineTree passes the course slug as a query param', () => {
    API.getOutlineTree('aamc')
    expect(lastCall()).toEqual(['/api/v1/tutor/outline', { query: { course: 'aamc' } }])
  })

  it('getFlagged defaults limit to 20 and forwards an override', () => {
    API.getFlagged()
    expect(lastCall()[1]).toEqual({ query: { limit: 20 } })
    API.getFlagged(5)
    expect(lastCall()[1]).toEqual({ query: { limit: 5 } })
  })

  it('getRecentSessions / getRecentCaptures forward their count param', () => {
    API.getRecentSessions(3)
    expect(lastCall()).toEqual(['/api/v1/tutor/sessions/recent', { query: { n: 3 } }])
    API.getRecentCaptures()
    expect(lastCall()).toEqual(['/api/v1/tutor/captures/recent', { query: { n: 8 } }])
  })

  it('getConceptEdges forwards arbitrary filter params (default = empty query)', () => {
    API.getConceptEdges()
    expect(lastCall()).toEqual(['/api/v1/concept-edges', { query: {} }])
    API.getConceptEdges({ node_id: 7, kind: 'similarity', limit: 50 })
    expect(lastCall()[1]).toEqual({ query: { node_id: 7, kind: 'similarity', limit: 50 } })
  })

  it('getAtomicFacts / getPdfSources / getNotionPages forward filters', () => {
    API.getAtomicFacts({ node_id: 4, pdf_source_id: 2, limit: 200 })
    expect(lastCall()).toEqual(['/api/v1/atomic-facts', { query: { node_id: 4, pdf_source_id: 2, limit: 200 } }])
    API.getPdfSources({ course_id: 1, status: 'ingested', limit: 10 })
    expect(lastCall()).toEqual(['/api/v1/pdf-sources', { query: { course_id: 1, status: 'ingested', limit: 10 } }])
    API.getNotionPages({ node_id: 9 })
    expect(lastCall()).toEqual(['/api/v1/notion/pages', { query: { node_id: 9 } }])
  })

  it('open mastery routes interpolate the id into the path (⊥ query)', () => {
    API.getCourseMastery(42)
    expect(lastCall()).toEqual(['/api/v1/outline/courses/42/mastery'])
    API.getNodeMastery(7)
    expect(lastCall()).toEqual(['/api/v1/outline/nodes/7/mastery'])
  })

  it('health / admin reads hit fixed paths', () => {
    API.getTutorHealthz()
    expect(lastCall()).toEqual(['/api/v1/tutor/healthz'])
    API.getAdminJobs()
    expect(lastCall()).toEqual(['/api/v1/admin/jobs'])
    API.getSystemStatus()
    expect(lastCall()).toEqual(['/api/v1/admin/status'])
    API.getAnkiReviewQueue()
    expect(lastCall()).toEqual(['/api/v1/anki/review-queue'])
    API.getLoadAdherence()
    expect(lastCall()).toEqual(['/api/v1/anki/load-adherence'])
    API.getLoadConfig()
    expect(lastCall()).toEqual(['/api/v1/anki/load-config'])
  })
})

describe('reads — path-segment encoding (real, done inside api.ts)', () => {
  it('getSessionSummary percent-encodes the test id', () => {
    API.getSessionSummary('test 1/2')
    expect(lastCall()).toEqual(['/api/v1/tutor/sessions/test%201%2F2/summary'])
  })

  it('getQuestionByQid percent-encodes the qid', () => {
    API.getQuestionByQid('UW/abc 9')
    expect(lastCall()).toEqual(['/api/v1/tutor/questions/by-qid/UW%2Fabc%209'])
  })

  it('getCardsByQid percent-encodes the qid', () => {
    API.getCardsByQid('q#1')
    expect(lastCall()).toEqual(['/api/v1/anki/cards/by-qid/q%231'])
  })
})

describe('writes — method + body payload shape', () => {
  it('createCourse POSTs slug/name/description (description optional)', () => {
    API.createCourse('bio', 'Biology')
    expect(lastCall()).toEqual([
      '/api/v1/courses',
      { method: 'POST', body: { slug: 'bio', name: 'Biology', description: undefined } }
    ])
    API.createCourse('bio', 'Biology', 'intro')
    expect(lastCall()[1]).toEqual({ method: 'POST', body: { slug: 'bio', name: 'Biology', description: 'intro' } })
  })

  it('importOutline interpolates the course id and POSTs the schema verbatim', () => {
    const schema = { course: { slug: 'bio' }, nodes: [{ path: ['Cell'], kind: 'topic', name: 'Cell' }] }
    API.importOutline(12, schema)
    expect(lastCall()).toEqual([
      '/api/v1/courses/12/outline:import',
      { method: 'POST', body: schema }
    ])
  })

  it('saveDiscriminator POSTs the (question_id, factor_text, node_id) discriminator key', () => {
    API.saveDiscriminator(99, 'mistook affinity for capacity', 4)
    expect(lastCall()).toEqual([
      '/api/v1/pkm/discriminators',
      { method: 'POST', body: { question_id: 99, factor_text: 'mistook affinity for capacity', node_id: 4 } }
    ])
  })

  it('saveDiscriminator omits node_id when not provided', () => {
    API.saveDiscriminator(99, 'factor')
    expect(lastCall()[1]).toEqual({ method: 'POST', body: { question_id: 99, factor_text: 'factor', node_id: undefined } })
  })
})

describe('error propagation', () => {
  it('rejections from the client wrapper bubble through unchanged (ApiError 401/500)', async () => {
    const err = new Error('GET /api/v1/courses → 401')
    mockApi.mockRejectedValueOnce(err)
    await expect(API.listCourses()).rejects.toBe(err)
  })

  it('resolved values pass through to the caller', async () => {
    const courses = [{ id: 1, slug: 'aamc', name: 'MCAT', description: null }]
    mockApi.mockResolvedValueOnce(courses as never)
    await expect(API.listCourses()).resolves.toEqual(courses)
  })
})
