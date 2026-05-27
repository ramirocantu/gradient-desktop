// Domain types. The app renders the rich shapes the design proposal assumes;
// the data layer (data/*) adapts the live FastAPI payloads into these and fills
// the gaps the backend doesn't expose yet (mastery, item counts, connections,
// atomic facts, Notion pages) from bundled mock data.

export type MasteryViz = 'heatmap' | 'bars' | 'dots' | 'sunburst'
export type TutorLayout = 'docked' | 'split' | 'floating'

// Fixed display preferences (tutor layout, mastery viz mode). The in-app
// tweaks panel was removed; these defaults are set once in App.
export interface Tweaks {
  reviewLayout: TutorLayout
  masteryViz: MasteryViz
}

export interface Course {
  id: number
  slug: string
  name: string
  shortName: string
  abbr: string
  nodeCount: number
  questionCount: number
  ankiCount: number
  factCount: number
  notionPageCount: number
}

export type NodeKind = 'section' | 'fc' | 'cc' | 'topic'

export interface OutlineNodeT {
  id: number
  parent: number | null
  depth: number
  kind: NodeKind | string
  name: string
  abbr?: string
  mastery: number
  items: number
  current?: boolean
}

export interface CaptureT {
  id: string
  source: string
  title: string
  node: number | null
  attemptedAt: string
  isCorrect: boolean | null
  flagged: boolean
  status: 'categorized' | 'needs-review' | 'uncategorized'
}

export interface ChoiceT {
  letter: string
  text: string
  picked: boolean
  correct: boolean
  distribution: number
}

export interface ReviewQuestionT {
  qid: number | string
  questionId?: number
  source: string
  testId: string
  attemptedAt: string
  timeSeconds: number
  node: number
  flagged: boolean
  stem: string
  choices: ChoiceT[]
  explanation: string
  pastAttempts: { date: string; correct: boolean; pick: string; time: number }[]
  tags: { node: number; source: string; confidence?: number }[]
  linkedAnki: { id: string; front: string; deck: string; retention: number; interval: string; due: string }[]
  linkedFacts: { id: string; text: string; pdf: string; page: number }[]
}

export interface AnkiCardT {
  id: string
  front: string
  node: number | null
  retention: number
  interval: string
  due: string
  lapses: number
}

export interface SessionT {
  id: string
  date: string
  items: number
  correct: number
  time: string
  source: string
  node: number
}

// Live session-summary detail (¶T2), adapted from /tutor/sessions/{id}/summary.
// byTopic rows feed MasteryViz/MasteryBars directly.
export interface SessionDetailT {
  testId: string
  attempts: number
  correct: number
  accuracy: number
  flaggedCount: number
  byTopic: { id: number; name: string; mastery: number; items: number; abbr?: string }[]
  topicCount: number
}

export interface PdfT {
  id: string
  filename: string
  pages: number
  status: string
  factsCount: number
  ingestedAt: string
  node: number | null
  sha: string
}

export interface FactT {
  id: string
  text: string
  node: number
  pdf: string
  page: number
  version: string
}

export interface NotionPageT {
  id: string
  node: number
  title: string
  blocks: number
  lastSynced: string
  status: string
  url: string | null
}

export interface ConnectionT {
  from: { kind: string; id: number | string; label: string }
  to: { kind: string; id: number | string; label: string }
  via: string
  node: number
  when: string
  score?: number
  confidence?: number
}

export interface DiscriminatorT {
  id: string
  question: number
  factor: string
  node: number
  when: string
}

export interface TodayT {
  date: string
  flaggedCount: number
  needsReviewCount: number
  ankiDue: number
  ankiTarget: number
  ankiCompleted: number
  capturesAwaiting: number
  pdfNew: number
  newConnections: number
  activeNodes: number[]
}

// The composite object every view reads. Built by the store from mock data,
// then domain-by-domain overlaid with live API results when reachable.
export interface DB {
  COURSE: Course
  OUTLINE: OutlineNodeT[]
  NODE_BY_ID: Record<number, OutlineNodeT>
  nodePath: (id: number) => string[]
  CAPTURES: CaptureT[]
  REVIEW_QUESTION: ReviewQuestionT
  ANKI_QUEUE: AnkiCardT[]
  ANKI_LOAD: number[]
  SESSIONS: SessionT[]
  PDFS: PdfT[]
  FACTS: FactT[]
  NOTION_PAGES: NotionPageT[]
  CONNECTIONS: ConnectionT[]
  DISCRIMINATORS: DiscriminatorT[]
  TODAY: TodayT
}

// Which domains are backed by a real endpoint vs. always-mock (P2 / fenced).
export type Domain =
  | 'course' | 'outline' | 'flagged' | 'sessions' | 'captures'
  | 'anki' | 'review'
export type StubDomain = 'mastery' | 'connections' | 'facts' | 'notion'
