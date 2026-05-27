// Typed endpoint functions over the FastAPI contract (docs/openapi.json,
// docs/BACKEND_CORE.md). Response shapes mirror the service-layer dicts; where
// the backend returns loose dicts these are best-effort interfaces.
import { api } from './client'

export interface ApiCourse {
  id: number
  slug: string
  name: string
  description: string | null
}

export interface ApiOutlineNode {
  node_id: number
  parent_id: number | null
  kind: string
  name: string
  depth: number
  position: number
  path?: string
}
export interface OutlineTreeResp {
  course: ApiCourse
  nodes: ApiOutlineNode[]
}

export interface FlaggedAttempt {
  attempt_id: number
  qid: string
  stem_preview: string
  topics: unknown[]
  note_text: string | null
  flagged_at: string
}

export interface RecentSession {
  test_id: string
  attempt_count: number
  correct_count: number
  accuracy: number
  started_at: string | null
  ended_at: string | null
}

export interface ByTopic {
  node_id: number
  name: string
  path: string
  kind: string
  attempt_count: number
  correct_count: number
  accuracy: number
}
export interface SessionSummary extends RecentSession {
  by_topic: ByTopic[]
  top_topics: ByTopic[]
  flagged_attempts: { attempt_id: number; qid: string; stem_preview: string }[]
  notes: unknown[]
}

export interface RecentCapture {
  attempt_id: number
  question_id: number
  qid: string
  stem_preview: string
  attempted_at: string
  is_correct: boolean | null
  selected_choice: string | null
  flagged: boolean
  uworld_test_id: string | null
  topics: unknown[]
  notes: unknown[]
}

export interface QuestionTagOut {
  node_id: number
  source: string
  confidence: number | null
  rationale: string | null
  manual_review: boolean
}
export interface QuestionDetail {
  qid: string
  question_id: number
  stem: string
  choices: unknown // JSON: array of {label|letter, text} or strings
  correct_choice: string | null
  explanation: string | null
  tags: QuestionTagOut[]
  // T42: per-choice attempt counts, the user's pick, full attempt history
  picked: string | null
  answer_distribution: Record<string, number>
  attempt_history: { attempted_at: string | null; is_correct: boolean; selected_choice: string; time_seconds: number | null }[]
  features: Record<string, unknown> | null
}

export interface AnkiCardOut {
  id: number
  anki_card_id: number
  deck_name: string
  note_id: number | null
  model_name: string | null
  fields_json: Record<string, unknown> | null
  due_date: string | null
  interval_days: number | null
  ease: number | null
  lapses: number | null
  queue: number | null
  sync_at: string
  tags: { tag_raw: string; parsed_kind: string; topic_id: number | null; question_qid: string | null }[]
  // T43: review-queue cards carry these (AnkiReviewQueueCardOut); null elsewhere
  retention?: number | null
  retrievability?: number | null
}

export interface LoadAdherence {
  window_days: number
  projected_daily_load: number
  projected_daily_minutes: number
  daily_card_review_budget: number
  daily_minutes_budget: number
  headroom_card_review_pct: number
  headroom_minutes_pct: number
  status_label: string
  // T43: dense per-day reviewed counts over the window
  reviewed_series: { date: string; reviewed: number }[]
}

export interface LoadConfig {
  daily_card_review_budget: number
  daily_minutes_budget: number
  updated_at: string
}

export interface DiscriminatorOut {
  id: number
  question_id: number
  factor_text: string
  node_id: number | null
  notion_block_id: string | null
  created_at: string
}

// ── reads ──
export const listCourses = () => api<ApiCourse[]>('/api/v1/courses')
export const getOutlineTree = (course: string) =>
  api<OutlineTreeResp>('/api/v1/tutor/outline', { query: { course } })
export const getFlagged = (limit = 20) =>
  api<FlaggedAttempt[]>('/api/v1/tutor/attempts/flagged', { query: { limit } })
export const getRecentSessions = (n = 5) =>
  api<RecentSession[]>('/api/v1/tutor/sessions/recent', { query: { n } })
export const getSessionSummary = (testId: string) =>
  api<SessionSummary>(`/api/v1/tutor/sessions/${encodeURIComponent(testId)}/summary`)
export const getRecentCaptures = (n = 8) =>
  api<RecentCapture[]>('/api/v1/tutor/captures/recent', { query: { n } })
export const getQuestionByQid = (qid: string) =>
  api<QuestionDetail>(`/api/v1/tutor/questions/by-qid/${encodeURIComponent(qid)}`)
export const getAnkiReviewQueue = () =>
  api<AnkiCardOut[]>('/api/v1/anki/review-queue')
export const getCardsByQid = (qid: string) =>
  api<AnkiCardOut[]>(`/api/v1/anki/cards/by-qid/${encodeURIComponent(qid)}`)
export const getLoadAdherence = () =>
  api<LoadAdherence>('/api/v1/anki/load-adherence')
export const getLoadConfig = () => api<LoadConfig>('/api/v1/anki/load-config')

// T44: per-node/subtree + course mastery (open routes, ⊥ token).
export interface MasteryRollup {
  attempts: number
  correct: number
  accuracy: number
  wilson_lower: number
}
export interface CourseMastery {
  course: { id: number; slug: string; name: string }
  total: MasteryRollup
  nodes: ({ node_id: number; name: string; kind: string; path: string } & MasteryRollup)[]
}
export interface NodeMastery {
  node: { id: number; name: string; kind: string; depth: number; parent_id: number | null; path: string }
  rollup: MasteryRollup
  children: ({ node_id: number; name: string; kind: string; path: string } & MasteryRollup)[]
}
export const getCourseMastery = (courseId: number) =>
  api<CourseMastery>(`/api/v1/outline/courses/${courseId}/mastery`)
export const getNodeMastery = (nodeId: number) =>
  api<NodeMastery>(`/api/v1/outline/nodes/${nodeId}/mastery`)

export interface Healthz {
  db_reachable: boolean
  db_error: string | null
  attempt_count: number
  latest_attempt_at: string | null
  recommender_ready: boolean
  backend_base_url: string
}
export interface SchedulerJob {
  job_id: string
  next_run_time: string | null
}
export const getTutorHealthz = () => api<Healthz>('/api/v1/tutor/healthz')
export const getAdminJobs = () => api<SchedulerJob[]>('/api/v1/admin/jobs')

export interface ServiceHealth {
  configured: boolean
  reachable: boolean
  detail: string | null
}
export interface JobHealth {
  job_id: string
  next_run_time: string | null
  last_run: {
    status: string
    started_at: string
    finished_at: string | null
    items_processed: number | null
    error_text: string | null
  } | null
}
export interface AdminStatus {
  anki: ServiceHealth
  openai: ServiceHealth
  notion: ServiceHealth
  jobs: JobHealth[]
}
export const getSystemStatus = () => api<AdminStatus>('/api/v1/admin/status')

// ── KB substrate reads (T45–T48 / ¶T8–¶T11). Token-gated; each returns []
// until its substrate is populated. Fields mirror app/api/v1/kb_reads.py. ──
export interface ConceptEdgeOut {
  id: number
  from: { node_id: number; name: string | null }
  to: { node_id: number; name: string | null }
  kind: string // 'similarity' | 'manual'
  score: number | null
  created_at: string
}
export const getConceptEdges = (params: { node_id?: number; kind?: string; limit?: number } = {}) =>
  api<ConceptEdgeOut[]>('/api/v1/concept-edges', { query: params })

export interface AtomicFactOut {
  id: number
  text: string
  node_id: number | null
  page: number | null
  pdf_source: { id: number; filename: string | null }
  created_at: string
  // NOTE: extractor_version lives on atomic_fact_tags (§I), not surfaced here.
}
export const getAtomicFacts = (params: { node_id?: number; pdf_source_id?: number; limit?: number } = {}) =>
  api<AtomicFactOut[]>('/api/v1/atomic-facts', { query: params })

// ── writes ──
export const createCourse = (slug: string, name: string, description?: string) =>
  api<ApiCourse>('/api/v1/courses', { method: 'POST', body: { slug, name, description } })
export const importOutline = (courseId: number, schema: unknown) =>
  api<{ course: ApiCourse; nodes_imported: number }>(
    `/api/v1/courses/${courseId}/outline:import`,
    { method: 'POST', body: schema }
  )
export const saveDiscriminator = (questionId: number, factorText: string, nodeId?: number) =>
  api<DiscriminatorOut>('/api/v1/pkm/discriminators', {
    method: 'POST',
    body: { question_id: questionId, factor_text: factorText, node_id: nodeId }
  })
