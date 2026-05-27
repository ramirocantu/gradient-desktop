// Single-question review + Socratic tutor pane + discriminator capture —
// the load-bearing PKM loop. Question detail is fetched live when the backend
// is up; the discriminator "Save" is a real POST /api/v1/pkm/discriminators.
import React from 'react'
import { Icon, KindGlyph, EmptyState, StubButton } from '../components/primitives'
import { masteryColor } from '../helpers'
import { useDB, useStore } from '../data/store'
import { useAsync } from '../data/useAsync'
import type { Tweaks } from '../types'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function ReviewView({ tweaks }: { tweaks: Tweaks }) {
  const db = useDB()
  const { status, loadQuestion, saveDiscriminator } = useStore()

  // Live question detail when the backend is up; sample question is the instant
  // fallback so the view is never blank (¶V2). useAsync isolates the fetch.
  const wantLive = status.online && status.hasToken
  const live = useAsync(
    () => (wantLive ? loadQuestion(String(db.REVIEW_QUESTION.qid)) : Promise.resolve(null)),
    [wantLive, db.REVIEW_QUESTION.qid]
  )
  const Q = live.data ?? db.REVIEW_QUESTION
  const qLoading = wantLive && live.loading
  const node = db.NODE_BY_ID[Q.node]
  const path = db.nodePath(Q.node)
  const layout = tweaks.reviewLayout || 'docked'

  const [tutorOpen, setTutorOpen] = React.useState(true)
  const [draftFactor, setDraftFactor] = React.useState('')
  const [saveState, setSaveState] = React.useState<SaveState>('idle')

  const onSave = React.useCallback(async () => {
    const qid = Q.questionId ?? (typeof Q.qid === 'number' ? Q.qid : Number(Q.qid))
    if (!qid || Number.isNaN(qid)) { setSaveState('error'); return }
    setSaveState('saving')
    const ok = await saveDiscriminator(draftFactor.trim(), qid, Q.node)
    setSaveState(ok ? 'saved' : 'error')
  }, [Q, draftFactor, saveDiscriminator])

  const [floatingOpen, setFloatingOpen] = React.useState(layout === 'floating')
  React.useEffect(() => { setFloatingOpen(layout === 'floating') }, [layout])

  const tutor = (
    <TutorPane draftFactor={draftFactor} setDraftFactor={setDraftFactor} onClose={() => setTutorOpen(false)} layout={layout} onSave={onSave} saveState={saveState} nodeName={node?.name ?? 'node'} />
  )

  // No live question to show (offline / no flagged target / failed load) →
  // honest empty-state, ⊥ blank stem or sample question.
  if (!Q.qid || (!Q.stem && !qLoading)) {
    return (
      <div className="content-scroll">
        <h1 className="h1">Review</h1>
        <div className="card" style={{ marginTop: 20 }}>
          <EmptyState
            text="No question loaded"
            hint={status.online ? 'flag an attempt to add it to the review queue' : 'backend offline — start the API to load questions'}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <div style={{ padding: '10px 24px', borderBottom: '0.5px solid var(--hair)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
          <span className="mono" style={{ font: '500 12px var(--mono)', color: 'var(--ink)', whiteSpace: 'nowrap' }}>Q · {Q.qid}</span>
          <span className="badge slate"><span className="d" />{Q.source}</span>
          <span className="badge"><span className="d" />{Q.testId}</span>
          {Q.flagged && <span className="badge flagged"><span className="d" />flagged</span>}
          <span style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
            {Q.attemptedAt}{Q.timeSeconds ? ` · ${Math.floor(Q.timeSeconds / 60)}m ${Q.timeSeconds % 60}s` : ''}
          </span>
          {qLoading && <span className="skeleton" style={{ width: 96, height: 14, borderRadius: 4 }} title="loading live question" />}
          <span style={{ flex: 1 }} />
          <StubButton name="review-prev" className="tb-btn ghost"><Icon name="chevron-u" size={12} /> Prev</StubButton>
          <StubButton name="review-next" className="tb-btn ghost">Next <Icon name="chevron-d" size={12} /></StubButton>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: layout === 'split' ? 980 : 720, margin: '0 auto', padding: '26px 32px 36px' }}>
            <div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {path.map((p, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span style={{ color: 'var(--ink-4)' }}>›</span>}
                  <span style={{ color: i === path.length - 1 ? 'var(--ink-2)' : 'var(--ink-3)', fontWeight: i === path.length - 1 ? 600 : 500, whiteSpace: 'nowrap' }}>{p}</span>
                </React.Fragment>
              ))}
            </div>

            <h1 style={{ font: '500 20px var(--serif)', color: 'var(--ink-3)', letterSpacing: '-0.005em', margin: '0 0 18px' }}>Stem</h1>
            <p style={{ font: '400 17px/1.6 var(--serif)', color: 'var(--ink)', margin: '0 0 28px', textWrap: 'pretty' } as React.CSSProperties}>{Q.stem}</p>

            <h2 style={{ font: '500 13px var(--sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 12px' }}>Choices · your pick vs correct</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 26 }}>
              {Q.choices.map((c) => {
                const isPicked = c.picked, isCorrect = c.correct
                const bg = isCorrect ? 'var(--moss-2)' : isPicked ? 'oklch(0.95 0.04 30)' : 'var(--panel)'
                const border = isCorrect ? 'var(--moss)' : isPicked ? 'oklch(0.62 0.18 30)' : 'var(--hair)'
                return (
                  <div key={c.letter} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 100px auto', gap: 14, alignItems: 'center', padding: '13px 16px', background: bg, border: `0.5px solid ${border}`, borderRadius: 9 }}>
                    <span style={{ width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', background: isCorrect ? 'var(--moss)' : isPicked ? 'oklch(0.62 0.18 30)' : 'rgba(40,30,15,0.06)', color: isCorrect || isPicked ? 'white' : 'var(--ink-2)', font: '600 12px var(--sans)' }}>{c.letter}</span>
                    <span style={{ font: '400 15px var(--serif)', color: 'var(--ink)' }}>{c.text}</span>
                    <div style={{ height: 4, borderRadius: 999, background: 'rgba(40,30,15,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.distribution * 100}%`, background: 'var(--ink-3)', opacity: 0.5 }} />
                    </div>
                    <span style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 90, justifyContent: 'flex-end' }}>
                      {isCorrect && <span className="badge moss" style={{ height: 18, padding: '0 6px' }}><Icon name="check" size={10} color="var(--moss)" />correct</span>}
                      {isPicked && !isCorrect && <span className="badge flagged" style={{ height: 18, padding: '0 6px' }}><Icon name="x" size={10} color="oklch(0.55 0.18 30)" />your pick</span>}
                      {c.distribution > 0 && <span className="mono" style={{ font: '500 11px var(--mono)', color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(c.distribution * 100)}%</span>}
                    </span>
                  </div>
                )
              })}
            </div>

            {Q.pastAttempts.length > 0 && (
              <div className="card" style={{ marginBottom: 26, padding: '12px 16px', background: 'var(--wash)', boxShadow: 'none' }}>
                <div style={{ font: '500 10.5px var(--sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>Attempt history · {Q.pastAttempts.length} attempts</div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  {Q.pastAttempts.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.correct ? 'var(--moss)' : 'oklch(0.62 0.18 30)' }} />
                      <span className="mono" style={{ font: '500 12px var(--mono)', color: 'var(--ink)' }}>{a.date}</span>
                      <span style={{ font: '500 12px var(--sans)', color: 'var(--ink-3)' }}>picked {a.pick} · {a.time}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 style={{ font: '500 13px var(--sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 8px' }}>Source explanation</h2>
            <p style={{ font: '400 15px/1.6 var(--serif)', color: 'var(--ink-2)', margin: '0 0 26px', textWrap: 'pretty' } as React.CSSProperties}>{Q.explanation}</p>

            <h2 style={{ font: '500 13px var(--sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 8px' }}>Tagged nodes</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
              {Q.tags.map((t, i) => {
                const n = db.NODE_BY_ID[t.node]
                return (
                  <span key={i} className="badge" style={{ height: 22, padding: '0 8px', background: t.source === 'schema_map' ? 'var(--slate-2)' : (t.confidence ?? 1) < 0.5 ? 'var(--amber-2)' : 'var(--panel)', border: '0.5px solid var(--hair)' }}>
                    <span className="d" style={{ background: t.source === 'schema_map' ? 'var(--slate)' : 'var(--clay)' }} />
                    {n?.name ?? `node ${t.node}`}
                    <span className="mono" style={{ color: 'var(--ink-3)', marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>{t.source === 'schema_map' ? 'schema' : t.confidence?.toFixed(2)}</span>
                  </span>
                )
              })}
              <StubButton name="review-add-tag" className="tb-btn ghost" style={{ height: 22, padding: '0 8px', font: '500 11px var(--sans)' }}><Icon name="plus" size={10} /> add tag</StubButton>
            </div>

            <h2 style={{ font: '500 13px var(--sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 8px' }}>Linked items</h2>
            {Q.linkedAnki.length > 0 && (
              <div className="card" style={{ padding: 4, marginBottom: 12 }}>
                {Q.linkedAnki.map((a, i) => (
                  <div key={a.id} className="item" style={{ display: 'grid', gridTemplateColumns: '16px 1fr auto auto auto', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, borderBottom: i === Q.linkedAnki.length - 1 ? 'none' : '0.5px solid var(--hair-2)' }}>
                    <KindGlyph kind="anki" />
                    <span style={{ font: '400 14px var(--serif)', color: 'var(--ink)' }}>{a.front}</span>
                    <span className="badge" style={{ height: 18, padding: '0 6px' }}><span className="d" style={{ background: masteryColor(a.retention) }} /><span className="tnum">{Math.round(a.retention * 100)}%</span></span>
                    <span style={{ font: '500 11px var(--mono)', color: 'var(--ink-3)' }}>{a.interval} · due {a.due}</span>
                    <Icon name="external" size={12} color="var(--ink-3)" />
                  </div>
                ))}
              </div>
            )}
            <div className="card" style={{ padding: 4 }}>
              {Q.linkedFacts.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', font: '500 12.5px var(--sans)', color: 'var(--ink-3)' }}>
                  <KindGlyph kind="fact" /> No atomic facts grounded to this node yet
                </div>
              ) : Q.linkedFacts.map((f, i) => (
                <div key={f.id} className="item" style={{ display: 'grid', gridTemplateColumns: '16px 1fr auto auto', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, borderBottom: i === Q.linkedFacts.length - 1 ? 'none' : '0.5px solid var(--hair-2)' }}>
                  <KindGlyph kind="fact" />
                  <span style={{ font: '400 14px var(--serif)', color: 'var(--ink)' }}>{f.text}</span>
                  <span style={{ font: '500 11px var(--mono)', color: 'var(--ink-3)' }}>{f.pdf} · p.{f.page}</span>
                  <Icon name="external" size={12} color="var(--ink-3)" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {layout === 'split' && tutorOpen && (
          <div style={{ borderTop: '0.5px solid var(--hair)', background: 'var(--sunken)', height: 320, display: 'flex', flexDirection: 'column', flexShrink: 0, minHeight: 0 }}>
            <div style={{ padding: '10px 24px', borderBottom: '0.5px solid var(--hair-2)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, background: 'var(--panel)' }}>
              <Icon name="spark" size={14} color="var(--clay)" />
              <span style={{ font: '600 13px var(--sans)', color: 'var(--ink)' }}>Tutor</span>
              <span className="badge slate" style={{ height: 18, padding: '0 6px' }}><span className="d" />MCP · gpt-4.1</span>
              <span style={{ flex: 1 }} />
              <button className="tb-btn" onClick={() => setTutorOpen(false)} style={{ height: 22, padding: '0 6px' }}><Icon name="x" size={11} /></button>
            </div>
            <SplitTutorBody draftFactor={draftFactor} setDraftFactor={setDraftFactor} onSave={onSave} saveState={saveState} nodeName={node?.name ?? 'node'} />
          </div>
        )}
      </div>

      {layout === 'docked' && tutorOpen && (
        <aside style={{ width: 380, flexShrink: 0, borderLeft: '0.5px solid var(--hair)', background: 'var(--sunken)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>{tutor}</aside>
      )}

      {layout === 'floating' && floatingOpen && (
        <FloatingTutor draftFactor={draftFactor} setDraftFactor={setDraftFactor} onClose={() => setFloatingOpen(false)} onSave={onSave} saveState={saveState} nodeName={node?.name ?? 'node'} />
      )}

      {layout !== 'floating' && !tutorOpen && (
        <button onClick={() => setTutorOpen(true)} style={{ position: 'absolute', right: 18, top: 60, height: 28, padding: '0 10px', background: 'var(--ink)', color: 'var(--canvas)', border: 0, borderRadius: 7, cursor: 'pointer', font: '500 12px var(--sans)', display: 'flex', alignItems: 'center', gap: 6, boxShadow: 'var(--shadow-md)' }}>
          <Icon name="spark" size={12} color="var(--canvas)" /> Tutor
        </button>
      )}
      {layout === 'floating' && !floatingOpen && (
        <button onClick={() => setFloatingOpen(true)} style={{ position: 'absolute', right: 18, top: 60, height: 28, padding: '0 10px', background: 'var(--ink)', color: 'var(--canvas)', border: 0, borderRadius: 7, cursor: 'pointer', font: '500 12px var(--sans)', display: 'flex', alignItems: 'center', gap: 6, boxShadow: 'var(--shadow-md)' }}>
          <Icon name="spark" size={12} color="var(--canvas)" /> Tutor <span className="kbd" style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--canvas)', borderColor: 'transparent' }}>⌘K</span>
        </button>
      )}
    </div>
  )
}

// Socratic tutor conversation is wired to the MCP host in P5 (¶T12); until then
// the message stream is an empty-state, ⊥ a scripted sample dialogue.
const TutorEmpty = () => (
  <EmptyState text="Tutor not yet wired" hint="Socratic turns arrive via the MCP host (P5)" />
)

interface TutorProps {
  draftFactor: string
  setDraftFactor: (v: string) => void
  onClose?: (() => void) | null
  layout: string
  onSave: () => void
  saveState: SaveState
  nodeName: string
}

function SaveButton({ onSave, saveState, label = 'Save factor' }: { onSave: () => void; saveState: SaveState; label?: string }) {
  if (saveState === 'saved') return <button className="tb-btn primary" disabled style={{ background: 'var(--moss)', borderColor: 'var(--moss)' }}><Icon name="check" size={11} color="var(--canvas)" /> Saved</button>
  return (
    <button className="tb-btn primary" onClick={onSave} disabled={saveState === 'saving'}>
      {saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Retry save' : label}
      <span className="kbd" style={{ background: 'rgba(255,255,255,0.15)', color: 'var(--canvas)', borderColor: 'transparent' }}>⌘↵</span>
    </button>
  )
}

function TutorPane({ draftFactor, setDraftFactor, onClose, layout, onSave, saveState, nodeName }: TutorProps) {
  const [input, setInput] = React.useState('')
  const showHeader = layout !== 'split'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {showHeader && (
        <div style={{ padding: '13px 16px 11px', borderBottom: '0.5px solid var(--hair)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Icon name="spark" size={14} color="var(--clay)" />
          <span style={{ font: '600 13px var(--sans)', color: 'var(--ink)' }}>Tutor</span>
          <span className="badge slate" style={{ height: 18, padding: '0 6px' }}><span className="d" />MCP · gpt-4.1</span>
          <span style={{ flex: 1 }} />
          <StubButton name="tutor-more" className="tb-btn" style={{ height: 22, padding: '0 6px' }}><Icon name="more" size={12} /></StubButton>
          {onClose && <button className="tb-btn" onClick={onClose} style={{ height: 22, padding: '0 6px' }}><Icon name="x" size={11} /></button>}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', minHeight: 0 }}>
        <TutorEmpty />
      </div>

      <DiscriminatorCapture draftFactor={draftFactor} setDraftFactor={setDraftFactor} onSave={onSave} saveState={saveState} nodeName={nodeName} />

      {layout !== 'split' && (
        <div style={{ borderTop: '0.5px solid var(--hair)', padding: '10px 14px', background: 'var(--sunken)', flexShrink: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={input} placeholder="Ask the tutor… (P5)" onChange={(e) => setInput(e.target.value)} style={{ flex: 1, height: 30, padding: '0 10px', border: '0.5px solid var(--hair)', borderRadius: 7, background: 'var(--panel)', font: '500 13px var(--sans)', color: 'var(--ink)', outline: 'none' }} />
          <StubButton name="tutor-send" className="tb-btn ghost" style={{ height: 30 }}><Icon name="arrow-r" size={12} /></StubButton>
        </div>
      )}
    </div>
  )
}

function DiscriminatorCapture({ draftFactor, setDraftFactor, onSave, saveState, nodeName }: { draftFactor: string; setDraftFactor: (v: string) => void; onSave: () => void; saveState: SaveState; nodeName: string }) {
  const onKey = (e: React.KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onSave() }
  return (
    <div style={{ borderTop: '0.5px solid var(--hair)', padding: '12px 16px', background: 'var(--panel)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon name="spark-line" size={12} color="var(--clay)" />
        <span style={{ font: '600 11px var(--sans)', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--clay)' }}>Discriminator factor</span>
        <span style={{ font: '500 11px var(--sans)', color: 'var(--ink-3)' }}>— what tipped you wrong, in one sentence</span>
      </div>
      <textarea value={draftFactor} onChange={(e) => setDraftFactor(e.target.value)} onKeyDown={onKey} style={{ width: '100%', minHeight: 60, padding: '9px 11px', border: '0.5px solid var(--hair)', borderRadius: 8, background: 'var(--wash)', font: '400 14px/1.5 var(--serif)', color: 'var(--ink)', resize: 'none', outline: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span style={{ font: '500 11px var(--sans)', color: saveState === 'error' ? 'oklch(0.55 0.18 30)' : 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="link" size={11} />
          {saveState === 'saved' ? <span style={{ color: 'var(--moss)' }}>persisted to Notion · {nodeName}</span>
            : saveState === 'error' ? 'save failed — backend offline?'
            : <>persists to <span style={{ color: 'var(--ink-2)' }}>Notion · {nodeName}</span></>}
        </span>
        <span style={{ flex: 1 }} />
        <StubButton name="discriminator-skip" className="tb-btn">Skip</StubButton>
        <SaveButton onSave={onSave} saveState={saveState} />
      </div>
    </div>
  )
}

function FloatingTutor({ draftFactor, setDraftFactor, onClose, onSave, saveState, nodeName }: Omit<TutorProps, 'layout'>) {
  return (
    <div style={{ position: 'absolute', left: '50%', top: 70, transform: 'translateX(-50%)', width: 540, maxHeight: 'calc(100% - 100px)', background: 'rgba(252,249,242,0.85)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '0.5px solid rgba(50,40,20,0.18)', borderRadius: 14, boxShadow: '0 24px 60px rgba(40,30,15,0.30), 0 2px 6px rgba(40,30,15,0.15)', zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '0.5px solid rgba(50,40,20,0.10)' }}>
        <Icon name="spark" size={14} color="var(--clay)" />
        <input placeholder="Ask the tutor — ⌘K" style={{ flex: 1, border: 0, background: 'transparent', font: '500 14.5px var(--sans)', color: 'var(--ink)', outline: 'none' }} />
        <button onClick={onClose ?? undefined} className="tb-btn" style={{ height: 22, padding: '0 6px' }}><Icon name="x" size={11} /></button>
      </div>
      <div style={{ padding: '12px 14px', maxHeight: 360, overflowY: 'auto' }}>
        <TutorPane draftFactor={draftFactor} setDraftFactor={setDraftFactor} onClose={null} layout="floating-body" onSave={onSave} saveState={saveState} nodeName={nodeName} />
      </div>
    </div>
  )
}

function SplitTutorBody({ draftFactor, setDraftFactor, onSave, saveState, nodeName }: { draftFactor: string; setDraftFactor: (v: string) => void; onSave: () => void; saveState: SaveState; nodeName: string }) {
  const onKey = (e: React.KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onSave() }
  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.4fr 1fr', minHeight: 0, overflow: 'hidden' }}>
      <div style={{ overflowY: 'auto', padding: '12px 18px', borderRight: '0.5px solid var(--hair)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720, margin: '0 auto' }}>
          <TutorEmpty />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--panel)' }}>
        <div style={{ padding: '12px 16px 10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Icon name="spark-line" size={12} color="var(--clay)" />
            <span style={{ font: '600 11px var(--sans)', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--clay)' }}>Discriminator factor</span>
          </div>
          <div style={{ font: '500 11px var(--sans)', color: 'var(--ink-3)', marginBottom: 6 }}>What tipped you wrong, in one sentence.</div>
          <textarea value={draftFactor} onChange={(e) => setDraftFactor(e.target.value)} onKeyDown={onKey} style={{ flex: 1, minHeight: 80, padding: '9px 11px', border: '0.5px solid var(--hair)', borderRadius: 8, background: 'var(--wash)', font: '400 13.5px/1.5 var(--serif)', color: 'var(--ink)', resize: 'none', outline: 'none' }} />
        </div>
        <div style={{ borderTop: '0.5px solid var(--hair-2)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--wash)' }}>
          <span style={{ font: '500 11px var(--sans)', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="link" size={11} /><span style={{ color: 'var(--ink-2)' }}>Notion · {nodeName}</span>
          </span>
          <span style={{ flex: 1 }} />
          <StubButton name="discriminator-skip" className="tb-btn">Skip</StubButton>
          <SaveButton onSave={onSave} saveState={saveState} label="Save" />
        </div>
      </div>
    </div>
  )
}
