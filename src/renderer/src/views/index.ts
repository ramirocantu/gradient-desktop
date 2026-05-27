export type View =
  | 'home' | 'review' | 'outline' | 'node' | 'anki' | 'facts'
  | 'pdfs' | 'notion' | 'captures' | 'session' | 'settings' | 'onboard'

export { HomeView } from './Home'
export { ReviewView } from './Review'
export { OutlineView, NodeDetailView } from './Outline'
export {
  AnkiView, FactsView, PdfsView, NotionView,
  CapturesView, SessionView, SettingsView, OnboardingView
} from './Supporting'
