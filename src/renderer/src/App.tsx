import React from 'react'
import { Icon } from './components/primitives'
import { Sidebar, Toolbar } from './components/shell'
import { useDB } from './data/store'
import {
  HomeView, ReviewView, OutlineView, NodeDetailView, AnkiView, FactsView,
  PdfsView, NotionView, CapturesView, SessionView, SettingsView, OnboardingView
} from './views'
import type { View } from './views'
import type { Tweaks } from './types'

// Fixed display preferences (the in-app tweaks panel was removed):
// docked tutor + heatmap mastery.
const TWEAKS: Tweaks = { reviewLayout: 'docked', masteryViz: 'heatmap' }

export default function App() {
  const db = useDB()
  const t = TWEAKS
  const [view, setView] = React.useState<View>('home')

  const counts = {
    review: db.TODAY.flaggedCount,
    anki: Math.max(0, db.TODAY.ankiDue - db.TODAY.ankiCompleted),
    captures: db.TODAY.capturesAwaiting,
    pdfs: db.PDFS.length
  }

  const C = db.COURSE.shortName
  const crumbsFor = (v: View): string[] => {
    switch (v) {
      case 'home': return [C, 'Home']
      case 'review': return [C, 'Review queue', `Q · ${db.REVIEW_QUESTION.qid}`]
      case 'outline': return [C, 'Outline browser']
      case 'node': return [C, 'Outline', 'Node']
      case 'anki': return [C, 'Anki']
      case 'facts': return [C, 'Atomic facts']
      case 'pdfs': return [C, 'PDF inbox']
      case 'notion': return [C, 'Notion · write-out']
      case 'captures': return [C, 'Captures']
      case 'session': return [C, 'Sessions', db.SESSIONS[0]?.id ?? '—']
      case 'settings': return ['Gradient', 'Settings']
      case 'onboard': return ['Gradient', 'Add a course']
      default: return [C]
    }
  }

  const rightFor = (v: View): React.ReactNode => {
    switch (v) {
      case 'home': return (
        <button className="tb-btn"><Icon name="search" size={12} color="var(--ink-3)" /> Quick find <span className="kbd">⌘K</span></button>
      )
      case 'review': return (<>
        <button className="tb-btn"><Icon name="flag" size={11} /> Flag</button>
        <button className="tb-btn"><Icon name="link" size={11} /> Linked items</button>
      </>)
      case 'outline':
      case 'node': return (
        <button className="tb-btn"><Icon name="search" size={12} /> Search nodes</button>
      )
      default: return (
        <button className="tb-btn"><Icon name="search" size={12} color="var(--ink-3)" /> Search <span className="kbd">⌘K</span></button>
      )
    }
  }

  const renderView = (): React.ReactNode => {
    switch (view) {
      case 'home': return <HomeView tweaks={t} setView={setView} openQuestion={() => setView('review')} />
      case 'review': return <ReviewView tweaks={t} />
      case 'outline': return <OutlineView tweaks={t} setView={setView} />
      case 'node': return <NodeDetailView />
      case 'anki': return <AnkiView />
      case 'facts': return <FactsView />
      case 'pdfs': return <PdfsView />
      case 'notion': return <NotionView />
      case 'captures': return <CapturesView />
      case 'session': return <SessionView />
      case 'settings': return <SettingsView setView={setView} />
      case 'onboard': return <OnboardingView setView={setView} />
      default: return <HomeView tweaks={t} setView={setView} openQuestion={() => setView('review')} />
    }
  }

  const fullBleed = new Set<View>(['review', 'outline', 'pdfs'])

  return (
    <div className="desktop">
      <div className="window" data-screen-label={view}>
        <Sidebar view={view} setView={setView} counts={counts} />
        <main className="main">
          <Toolbar crumbs={crumbsFor(view)} right={rightFor(view)} />
          <div className="content" style={fullBleed.has(view) ? { overflow: 'hidden' } : undefined}>
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  )
}
