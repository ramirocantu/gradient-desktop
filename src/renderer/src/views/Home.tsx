import React from 'react'
import { Icon, KindGlyph, StatCard, MasteryViz, MasteryLegend, EmptyState, StubButton } from '../components/primitives'
import { masteryColor } from '../helpers'
import { useDB, useStore } from '../data/store'
import type { Tweaks } from '../types'
import type { View } from '.'

export function HomeView({ tweaks, setView, openQuestion }: { tweaks: Tweaks; setView: (v: View) => void; openQuestion: () => void }) {
  const db = useDB()
  const { status } = useStore()
  const T = db.TODAY
  const topNodes = db.OUTLINE.filter((n) => n.depth === 0)
  const Q = db.REVIEW_QUESTION
  const hasResume = status.live.has('review') && !!Q.qid

  return (
    <div className="content-scroll">
      <div style={{ marginBottom: 28 }}>
        {T.date && <div style={{ font: '500 11px var(--sans)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>{T.date}</div>}
        <h1 className="h1">Good morning.</h1>
        <p className="lede" style={{ marginTop: 8, maxWidth: 680 }}>
          You have {T.flaggedCount} flagged attempts to review and {Math.max(0, T.ankiDue - T.ankiCompleted)} Anki cards left in today's budget.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
        <StatCard label="Review queue" value={T.flaggedCount} sub="flagged" accent="clay"
          footer={
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}>
              <span className="badge flagged"><span className="d" />{T.flaggedCount} flagged</span>
              <span className="badge amber"><span className="d" />{T.needsReviewCount} low-conf tags</span>
            </div>
          }
          onClick={() => setView('review')} />

        <StatCard label="Anki" value={T.ankiDue - T.ankiCompleted} sub="due today" accent="plum"
          footer={
            <div>
              <div style={{ height: 4, borderRadius: 999, background: 'rgba(40,30,15,0.06)', overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', width: `${(T.ankiCompleted / T.ankiTarget) * 100}%`, background: 'var(--plum)' }} />
              </div>
              <div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{T.ankiCompleted} / {T.ankiTarget} of daily load</div>
            </div>
          }
          onClick={() => setView('anki')} />

        <StatCard label="Captures" value={T.capturesAwaiting} sub="uncategorized" accent="amber"
          footer={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}>
                <span className="tnum">{db.CAPTURES.length}</span> total today · <span className="tnum">{db.CAPTURES.filter((c) => c.status === 'categorized').length}</span> auto-tagged
              </span>
            </div>
          }
          onClick={() => setView('captures')} />

        <StatCard label="PDF inbox" value={db.PDFS.length} sub="ingested" accent="moss"
          footer={
            <div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}>
              <span className="tnum">{db.FACTS.length}</span> atomic facts
            </div>
          }
          onClick={() => setView('pdfs')} />
      </div>

      <div className="card" style={{ padding: 0, marginBottom: 28, overflow: 'hidden' }}>
        {hasResume ? (
          <div style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="badge clay"><span className="d" />resume</span>
              <span className="mono badge"><span className="d" />Q · {Q.qid}</span>
              <span style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}>{T.flaggedCount} flagged attempts in the queue</span>
            </div>
            <h2 className="h2" style={{ marginBottom: 4 }}>Resume your review queue</h2>
            <p style={{ font: '400 14.5px/1.5 var(--serif)', color: 'var(--ink-2)', margin: '0 0 12px', maxWidth: 640 }}>
              Pick up the next flagged attempt. The full question detail loads in the review pane.
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="tb-btn primary" onClick={() => openQuestion()}>Resume review <Icon name="arrow-r" size={12} /></button>
              <StubButton name="skip-next-flagged" className="tb-btn ghost">Skip · next flagged</StubButton>
              <StubButton name="open-in-tutor" className="tb-btn">Open in tutor <span className="kbd">⌘K</span></StubButton>
            </div>
          </div>
        ) : (
          <EmptyState text="Nothing flagged to resume" hint={status.online ? 'flag an attempt during review to build the queue' : 'backend offline — start the API to load your queue'} />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 24, marginBottom: 28 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: 14 }}>
            <h3 className="h3" style={{ font: '500 18px var(--serif)', marginBottom: 2, whiteSpace: 'nowrap' }}>Performance per topic</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}>
                {status.live.has('mastery') ? 'Live · accuracy-based mastery (subtree rollup)' : status.live.has('outline') ? 'Live outline · no attempts tagged yet' : 'Sample outline'}
              </div>
              <div style={{ marginLeft: 'auto' }}><MasteryLegend /></div>
            </div>
          </div>
          <div className="card" style={{ padding: '16px 18px' }}>
            {topNodes.length > 0
              ? <MasteryViz kind={tweaks.masteryViz} rows={topNodes} onSelect={() => setView('outline')} />
              : <EmptyState text="No outline loaded" hint={status.online ? 'import a course outline to see mastery' : 'backend offline'} />}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h3 className="h3" style={{ font: '500 18px var(--serif)', marginBottom: 2 }}>New connections</h3>
              <div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}>Cross-links between questions, anki, facts · today</div>
            </div>
            <span className="stub-badge" title="concept_edges is P2 — no endpoint yet (BACKEND_CORE §7)">no endpoint</span>
          </div>
          <div className="card" style={{ padding: 6 }}>
            {db.CONNECTIONS.length === 0 ? (
              <EmptyState text="No connections yet" hint="concept_edges endpoint pending (P2)" />
            ) : (
            <div className="linkrail">
              {db.CONNECTIONS.map((c, i) => (
                <div key={i} className="item" style={{ padding: '8px 10px' }}>
                  <KindGlyph kind={c.from.kind} />
                  <span style={{ flex: '0 1 auto', maxWidth: 140, font: '500 13px var(--sans)', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.from.label}</span>
                  <Icon name="arrow-r" size={11} color="var(--ink-4)" />
                  <KindGlyph kind={c.to.kind} />
                  <span style={{ flex: '0 1 auto', maxWidth: 140, font: '500 13px var(--sans)', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.to.label}</span>
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge slate" style={{ height: 18, padding: '0 6px', fontSize: 10.5 }}>
                      <span className="d" />{c.via}
                      {c.score && <span className="tnum" style={{ marginLeft: 4, color: 'var(--ink-3)' }}>{c.score.toFixed(2)}</span>}
                      {c.confidence && <span className="tnum" style={{ marginLeft: 4, color: 'var(--ink-3)' }}>{c.confidence.toFixed(2)}</span>}
                    </span>
                    <span style={{ font: '500 11px var(--sans)', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{c.when}</span>
                  </span>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h3 className="h3" style={{ font: '500 18px var(--serif)', marginBottom: 2 }}>Recent sessions</h3>
            <div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}>From UWorld + manual entry, last week</div>
          </div>
          <StubButton name="sessions-view-all" className="tb-btn">View all <Icon name="arrow-r" size={11} /></StubButton>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 90px 80px 100px 60px', padding: '9px 16px', font: '500 10.5px var(--sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', borderBottom: '0.5px solid var(--hair)' }}>
            <span>Session</span><span>Coverage</span>
            <span style={{ textAlign: 'right' }}>Score</span>
            <span style={{ textAlign: 'right' }}>Items</span>
            <span style={{ textAlign: 'right' }}>Time</span>
            <span />
          </div>
          {db.SESSIONS.length === 0 && <EmptyState text="No sessions yet" hint={status.online ? 'capture attempts to build session history' : 'backend offline'} />}
          {db.SESSIONS.map((s, i) => {
            const node = db.NODE_BY_ID[s.node]
            const score = s.items ? s.correct / s.items : 0
            return (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 90px 80px 100px 60px', padding: '11px 16px', alignItems: 'center', borderBottom: i === db.SESSIONS.length - 1 ? 'none' : '0.5px solid var(--hair-2)', cursor: 'pointer' }} onClick={() => setView('session')}>
                <div>
                  <div className="mono" style={{ font: '500 12px var(--mono)', color: 'var(--ink)' }}>{s.id}</div>
                  <div style={{ font: '500 11px var(--sans)', color: 'var(--ink-3)' }}>{s.date}</div>
                </div>
                <div style={{ font: '500 13px var(--sans)', color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {node?.abbr && <span style={{ font: '600 10px var(--mono)', color: 'var(--ink-3)', padding: '1px 5px', background: 'rgba(40,30,15,0.05)', borderRadius: 4, marginRight: 8 }}>{node.abbr}</span>}
                  {node?.name}
                </div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                  <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--m0)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score * 100}%`, background: masteryColor(score) }} />
                  </div>
                  <span className="mono" style={{ font: '500 12px var(--mono)', color: 'var(--ink)' }}>{Math.round(score * 100)}%</span>
                </div>
                <div style={{ textAlign: 'right', font: '500 12px var(--mono)', color: 'var(--ink-2)' }}>{s.correct}/{s.items}</div>
                <div style={{ textAlign: 'right', font: '500 12px var(--mono)', color: 'var(--ink-3)' }}>{s.time}</div>
                <div style={{ textAlign: 'right', color: 'var(--ink-3)' }}><Icon name="chevron-r" size={12} /></div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
