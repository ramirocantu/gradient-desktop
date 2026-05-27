// Bundled mock data, ported from the Claude Design proposal's data.js.
// Serves two roles:
//   1. Fallback when the backend is unreachable (the app stays clickable).
//   2. The permanent source for domains the backend doesn't expose yet —
//      per-node mastery (analytics FENCED), connections (concept_edges, P2),
//      atomic facts and Notion pages (P2 KB substrate).
import type {
  Course, OutlineNodeT, CaptureT, ReviewQuestionT, AnkiCardT, SessionT,
  PdfT, FactT, NotionPageT, ConnectionT, DiscriminatorT, TodayT
} from '../types'

export const COURSE: Course = {
  id: 1,
  slug: 'aamc',
  name: 'MCAT — AAMC Content Outline',
  shortName: 'AAMC',
  abbr: 'MC',
  nodeCount: 1554,
  questionCount: 2418,
  ankiCount: 9412,
  factCount: 1278,
  notionPageCount: 312
}

export const OUTLINE: OutlineNodeT[] = [
  { id: 1, parent: null, depth: 0, kind: 'section', name: 'Biological & Biochemical Foundations', abbr: 'B/BC', mastery: 0.62, items: 612 },
  { id: 11, parent: 1, depth: 1, kind: 'fc', name: 'Foundational Concept 1 — Biomolecules', mastery: 0.71, items: 184 },
  { id: 111, parent: 11, depth: 2, kind: 'cc', name: '1A · Structure & function of proteins', mastery: 0.74, items: 62 },
  { id: 1111, parent: 111, depth: 3, kind: 'topic', name: 'Amino acids', mastery: 0.84, items: 14 },
  { id: 1112, parent: 111, depth: 3, kind: 'topic', name: 'Protein structure', mastery: 0.78, items: 16 },
  { id: 1113, parent: 111, depth: 3, kind: 'topic', name: 'Non-enzymatic protein function', mastery: 0.62, items: 12 },
  { id: 1114, parent: 111, depth: 3, kind: 'topic', name: 'Enzymes', mastery: 0.69, items: 20 },
  { id: 112, parent: 11, depth: 2, kind: 'cc', name: '1B · Transmission of genetic information', mastery: 0.66, items: 58 },
  { id: 113, parent: 11, depth: 2, kind: 'cc', name: '1C · Transmission of heritable information', mastery: 0.81, items: 41 },
  { id: 114, parent: 11, depth: 2, kind: 'cc', name: '1D · Principles of bioenergetics', mastery: 0.55, items: 23 },
  { id: 1141, parent: 114, depth: 3, kind: 'topic', name: 'Bioenergetics — thermodynamics', mastery: 0.48, items: 8 },
  { id: 1142, parent: 114, depth: 3, kind: 'topic', name: 'Carbohydrates', mastery: 0.61, items: 7 },
  { id: 1143, parent: 114, depth: 3, kind: 'topic', name: 'Lipids', mastery: 0.42, items: 6, current: true },
  { id: 1144, parent: 114, depth: 3, kind: 'topic', name: 'Beta-oxidation of fatty acids', mastery: 0.35, items: 5, current: true },

  { id: 12, parent: 1, depth: 1, kind: 'fc', name: 'Foundational Concept 2 — Cellular & organism systems', mastery: 0.58, items: 198 },
  { id: 121, parent: 12, depth: 2, kind: 'cc', name: '2A · Cell assemblies → organism', mastery: 0.60, items: 71 },
  { id: 122, parent: 12, depth: 2, kind: 'cc', name: '2B · Cellular reproduction', mastery: 0.54, items: 49 },
  { id: 123, parent: 12, depth: 2, kind: 'cc', name: '2C · Reproduction & embryonic development', mastery: 0.61, items: 38 },

  { id: 13, parent: 1, depth: 1, kind: 'fc', name: 'Foundational Concept 3 — Organ systems', mastery: 0.49, items: 230 },
  { id: 131, parent: 13, depth: 2, kind: 'cc', name: '3A · Nervous & endocrine systems', mastery: 0.55, items: 84 },
  { id: 132, parent: 13, depth: 2, kind: 'cc', name: '3B · Circulation, respiration, excretion', mastery: 0.46, items: 76 },

  { id: 2, parent: null, depth: 0, kind: 'section', name: 'Chemical & Physical Foundations', abbr: 'C/P', mastery: 0.51, items: 421 },
  { id: 21, parent: 2, depth: 1, kind: 'fc', name: 'Foundational Concept 4 — Physical principles', mastery: 0.55, items: 178 },
  { id: 22, parent: 2, depth: 1, kind: 'fc', name: 'Foundational Concept 5 — Chemical processes', mastery: 0.47, items: 243 },

  { id: 3, parent: null, depth: 0, kind: 'section', name: 'Psychological, Social, Biological Foundations', abbr: 'P/S', mastery: 0.68, items: 318 },
  { id: 31, parent: 3, depth: 1, kind: 'fc', name: 'Foundational Concept 6 — Perception, thought, emotion', mastery: 0.71, items: 122 },
  { id: 32, parent: 3, depth: 1, kind: 'fc', name: 'Foundational Concept 7 — Self & society', mastery: 0.64, items: 99 },

  { id: 4, parent: null, depth: 0, kind: 'section', name: 'Critical Analysis & Reasoning Skills', abbr: 'CARS', mastery: 0.58, items: 203 }
]

export const CAPTURES: CaptureT[] = [
  { id: 'c-9821', source: 'uworld', title: 'Q · 12420 · Biochem', node: 1143, attemptedAt: '12 min ago', isCorrect: false, flagged: true, status: 'categorized' },
  { id: 'c-9820', source: 'uworld', title: 'Q · 12419 · Genetics', node: 112, attemptedAt: '14 min ago', isCorrect: true, flagged: false, status: 'categorized' },
  { id: 'c-9819', source: 'uworld', title: 'Q · 12418 · Beta-oxidation', node: 1144, attemptedAt: '16 min ago', isCorrect: false, flagged: false, status: 'categorized' },
  { id: 'c-9818', source: 'uworld', title: 'Q · 12417 · Saponification', node: 1143, attemptedAt: '19 min ago', isCorrect: false, flagged: true, status: 'needs-review' },
  { id: 'c-9817', source: 'uworld', title: 'Q · 12416 · TCA cycle', node: 114, attemptedAt: '22 min ago', isCorrect: true, flagged: false, status: 'categorized' },
  { id: 'c-9816', source: 'manual', title: 'Q · membrane potentials', node: null, attemptedAt: '1 hr ago', isCorrect: null, flagged: false, status: 'uncategorized' },
  { id: 'c-9815', source: 'manual', title: 'Q · counter-current exchange', node: null, attemptedAt: '1 hr ago', isCorrect: null, flagged: false, status: 'uncategorized' },
  { id: 'c-9814', source: 'pdf-qset', title: 'Q · Berkeley Review p.412', node: null, attemptedAt: 'yesterday', isCorrect: null, flagged: false, status: 'uncategorized' }
]

export const REVIEW_QUESTION: ReviewQuestionT = {
  qid: 12420,
  source: 'uworld',
  testId: 'Bio-Sys 14',
  attemptedAt: 'Today · 9:42am',
  timeSeconds: 138,
  node: 1143,
  flagged: true,
  stem: 'A research team studies the energy yield from palmitate (C16) catabolism in a hepatocyte. Palmitate is fully oxidized via β-oxidation, then the resulting acetyl-CoA enters the citric-acid cycle. Assuming standard yields and that the cell uses cytosolic NADH via the malate-aspartate shuttle, approximately how many net ATP equivalents are produced per molecule of palmitate?',
  choices: [
    { letter: 'A', text: '96', picked: false, correct: false, distribution: 0.18 },
    { letter: 'B', text: '106', picked: true, correct: false, distribution: 0.51 },
    { letter: 'C', text: '120', picked: false, correct: true, distribution: 0.24 },
    { letter: 'D', text: '129', picked: false, correct: false, distribution: 0.07 }
  ],
  explanation: 'Palmitate (C16) undergoes 7 cycles of β-oxidation, generating 7 FADH₂, 7 NADH, and 8 acetyl-CoA. Each acetyl-CoA yields 3 NADH, 1 FADH₂, 1 GTP via the citric-acid cycle. With the malate-aspartate shuttle, cytosolic NADH yields 2.5 ATP. Subtracting the 2 ATP cost of activation gives a net 120 ATP equivalents.',
  pastAttempts: [
    { date: 'Today', correct: false, pick: 'B', time: 138 },
    { date: 'Apr 18', correct: false, pick: 'A', time: 96 },
    { date: 'Mar 02', correct: true, pick: 'C', time: 84 }
  ],
  tags: [
    { node: 1144, source: 'llm', confidence: 0.88 },
    { node: 1143, source: 'llm', confidence: 0.74 },
    { node: 114, source: 'schema_map' }
  ],
  linkedAnki: [
    { id: 'ak-2418', front: 'β-oxidation per cycle: NADH / FADH₂ / acetyl-CoA?', deck: 'AnKing::Biochem::FA', retention: 0.91, interval: '23d', due: 'in 3d' },
    { id: 'ak-2419', front: 'Net ATP from palmitate (C16) — show breakdown.', deck: 'AnKing::Biochem::FA', retention: 0.62, interval: '4d', due: 'today' },
    { id: 'ak-2511', front: 'Malate-aspartate vs glycerol-3-phosphate shuttle yields.', deck: 'AnKing::Biochem::FA', retention: 0.78, interval: '8d', due: 'in 5d' }
  ],
  linkedFacts: [
    { id: 'f-731', text: 'Palmitate has 16 carbons → 7 β-oxidation cycles → 8 acetyl-CoA.', pdf: 'Lehninger ch.17.pdf', page: 643 },
    { id: 'f-732', text: 'Activation of fatty acid to acyl-CoA costs 2 ATP equivalents (ATP → AMP + PPᵢ).', pdf: 'Lehninger ch.17.pdf', page: 645 },
    { id: 'f-733', text: 'Malate-aspartate shuttle: cytosolic NADH yields 2.5 ATP in mitochondrion; glycerol-3-P yields 1.5.', pdf: 'Lehninger ch.18.pdf', page: 712 }
  ]
}

export const ANKI_QUEUE: AnkiCardT[] = [
  { id: 'ak-2419', front: 'Net ATP from palmitate (C16) — show breakdown.', node: 1144, retention: 0.62, interval: '4d', due: 'due now', lapses: 3 },
  { id: 'ak-2511', front: 'Malate-aspartate vs glycerol-3-phosphate shuttle yields.', node: 1143, retention: 0.78, interval: '8d', due: 'due now', lapses: 1 },
  { id: 'ak-3102', front: 'TCA cycle: irreversible steps and their enzymes.', node: 114, retention: 0.84, interval: '12d', due: 'due now', lapses: 0 },
  { id: 'ak-1840', front: 'Steroid hormones: cholesterol → pregnenolone enzyme?', node: 1143, retention: 0.71, interval: '6d', due: 'in 2h', lapses: 2 },
  { id: 'ak-2206', front: 'Ketogenesis vs lipogenesis: tissue specificity.', node: 1144, retention: 0.58, interval: '3d', due: 'in 5h', lapses: 4 },
  { id: 'ak-0921', front: 'Glycogen phosphorylase regulation: epinephrine vs insulin.', node: 114, retention: 0.93, interval: '32d', due: 'tomorrow', lapses: 0 }
]

export const ANKI_LOAD: number[] = [
  58, 62, 60, 71, 45, 33, 60, 64, 59, 60, 28, 55, 62, 60, 70,
  62, 58, 0, 0, 44, 62, 68, 60, 60, 71, 58, 60, 64, 60, 47
]

export const SESSIONS: SessionT[] = [
  { id: 'Bio-Sys 14', date: 'Today', items: 28, correct: 18, time: '44m', source: 'uworld', node: 11 },
  { id: 'Mixed 042', date: 'Yesterday', items: 40, correct: 31, time: '61m', source: 'uworld', node: 1 },
  { id: 'Bio-Sys 13', date: 'May 24', items: 28, correct: 21, time: '39m', source: 'uworld', node: 12 },
  { id: 'CARS-fb 8', date: 'May 23', items: 9, correct: 6, time: '48m', source: 'uworld', node: 4 },
  { id: 'Chem-Sys 6', date: 'May 22', items: 32, correct: 19, time: '57m', source: 'uworld', node: 22 }
]

export const PDFS: PdfT[] = [
  { id: 'p-21', filename: 'Lehninger_ch17_fatty-acid-catabolism.pdf', pages: 38, status: 'ingested', factsCount: 47, ingestedAt: '2h ago', node: 1144, sha: '9c4f...a821' },
  { id: 'p-22', filename: 'Lehninger_ch18_aa-oxidation-urea-cycle.pdf', pages: 42, status: 'ingested', factsCount: 52, ingestedAt: '2h ago', node: 11, sha: '8b1e...c004' },
  { id: 'p-23', filename: 'ms2-cell-signaling-lecture-notes.pdf', pages: 14, status: 'extracting', factsCount: 0, ingestedAt: '5m ago', node: 121, sha: '—' },
  { id: 'p-24', filename: 'harvard-OCW-bioenergetics-handout.pdf', pages: 24, status: 'needs-tagging', factsCount: 31, ingestedAt: 'yesterday', node: null, sha: '1f3a...77b9' },
  { id: 'p-20', filename: 'Khan-academy-renal-physiology.pdf', pages: 9, status: 'ingested', factsCount: 18, ingestedAt: '3d ago', node: 132, sha: '55a0...2c1d' }
]

export const FACTS: FactT[] = [
  { id: 'f-731', text: 'Palmitate has 16 carbons → 7 β-oxidation cycles → 8 acetyl-CoA.', node: 1144, pdf: 'Lehninger_ch17', page: 643, version: 'v3' },
  { id: 'f-732', text: 'Activation of fatty acid to acyl-CoA costs 2 ATP equivalents (ATP → AMP + PPᵢ).', node: 1144, pdf: 'Lehninger_ch17', page: 645, version: 'v3' },
  { id: 'f-733', text: 'Malate-aspartate shuttle: cytosolic NADH yields 2.5 ATP; glycerol-3-P yields 1.5.', node: 1143, pdf: 'Lehninger_ch18', page: 712, version: 'v3' },
  { id: 'f-734', text: 'Each cycle of β-oxidation produces 1 FADH₂ and 1 NADH.', node: 1144, pdf: 'Lehninger_ch17', page: 644, version: 'v3' },
  { id: 'f-735', text: 'Acetyl-CoA → citric-acid cycle → 3 NADH + 1 FADH₂ + 1 GTP per turn.', node: 114, pdf: 'Lehninger_ch16', page: 622, version: 'v3' }
]

export const NOTION_PAGES: NotionPageT[] = [
  { id: 'np-1144', node: 1144, title: 'Beta-oxidation of fatty acids', blocks: 23, lastSynced: '2h ago', status: 'synced', url: 'notion.so/g/beta-oxidation' },
  { id: 'np-1143', node: 1143, title: 'Lipids', blocks: 41, lastSynced: '2h ago', status: 'synced', url: 'notion.so/g/lipids' },
  { id: 'np-114', node: 114, title: 'Principles of bioenergetics', blocks: 18, lastSynced: '5h ago', status: 'synced', url: 'notion.so/g/bioenergetics' },
  { id: 'np-112', node: 112, title: 'Transmission of genetic information', blocks: 67, lastSynced: '1d ago', status: 'synced', url: 'notion.so/g/genetic-info' },
  { id: 'np-1142', node: 1142, title: 'Carbohydrates', blocks: 29, lastSynced: '—', status: 'pending', url: null },
  { id: 'np-1141', node: 1141, title: 'Thermodynamics', blocks: 12, lastSynced: '1d ago', status: 'synced', url: 'notion.so/g/thermo' }
]

export const CONNECTIONS: ConnectionT[] = [
  { from: { kind: 'question', id: 12420, label: 'Q · palmitate ATP yield' }, to: { kind: 'fact', id: 'f-731', label: '16C → 7 cycles → 8 acetyl-CoA' }, via: 'tag', node: 1144, when: '12 min ago' },
  { from: { kind: 'question', id: 12420, label: 'Q · palmitate ATP yield' }, to: { kind: 'anki', id: 'ak-2419', label: 'Net ATP from palmitate' }, via: 'similarity', node: 1144, when: '12 min ago', score: 0.91 },
  { from: { kind: 'fact', id: 'f-733', label: 'Malate-aspartate yields 2.5 ATP' }, to: { kind: 'node', id: 1143, label: 'Lipids' }, via: 'similarity', node: 1143, when: '2h ago', score: 0.86 },
  { from: { kind: 'anki', id: 'ak-2511', label: 'Malate-aspartate vs G3P shuttle' }, to: { kind: 'fact', id: 'f-733', label: 'Shuttle ATP yields' }, via: 'tag', node: 1143, when: '2h ago' },
  { from: { kind: 'question', id: 12418, label: 'Q · saponification' }, to: { kind: 'node', id: 1143, label: 'Lipids' }, via: 'llm-tag', node: 1143, when: '19 min ago', confidence: 0.79 },
  { from: { kind: 'fact', id: 'f-735', label: 'Acetyl-CoA → TCA yields' }, to: { kind: 'question', id: 12416, label: 'Q · TCA cycle' }, via: 'similarity', node: 114, when: '22 min ago', score: 0.94 }
]

export const DISCRIMINATORS: DiscriminatorT[] = [
  { id: 'd-104', question: 12420, factor: 'I conflated the +2.5 vs +1.5 ATP yield for cytosolic NADH — only the malate-aspartate shuttle gives 2.5.', node: 1144, when: 'Today' },
  { id: 'd-101', question: 12418, factor: 'Saponification is base-catalyzed; I picked the acid-catalyzed mechanism.', node: 1143, when: 'yesterday' },
  { id: 'd-099', question: 12388, factor: "Forgot the 2-ATP activation cost. Subtract from gross, don't add.", node: 1144, when: 'May 23' }
]

export const TODAY: TodayT = {
  date: 'Monday · May 26',
  flaggedCount: 6,
  needsReviewCount: 3,
  ankiDue: 47,
  ankiTarget: 60,
  ankiCompleted: 23,
  capturesAwaiting: 3,
  pdfNew: 1,
  newConnections: 12,
  activeNodes: [1144, 1143, 114]
}
