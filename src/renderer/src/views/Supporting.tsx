import React from 'react'
import { Icon, KindGlyph, StatCard, MasteryBars, EmptyState, StubButton } from '../components/primitives'
import { masteryColor } from '../helpers'
import { useDB, useStore } from '../data/store'
import { useAsync } from '../data/useAsync'
import type { View } from '.'

// ───────────────────────── ATOMIC FACTS ─────────────────────────
export function FactsView() {
  const db = useDB()
  return (
    <div className="content-scroll">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <h1 className="h1">Atomic facts</h1>
          <p className="lede" style={{ marginTop: 6, maxWidth: 580 }}>
            Grounded extractions from your PDF library. Each fact is tagged to an outline node and persisted as a Notion block under that node's page.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="stub-badge" title="PDF-ingest / atomic-fact workflow is P2 — no endpoint yet">no endpoint</span>
          <StubButton name="facts-filter" className="tb-btn ghost"><Icon name="filter" size={11} /> Filter</StubButton>
        </div>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 220px 60px 80px', padding: '10px 16px', font: '500 10.5px var(--sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', borderBottom: '0.5px solid var(--hair)' }}>
          <span /><span>Fact</span><span>Tagged node</span>
          <span style={{ textAlign: 'right' }}>Page</span>
          <span style={{ textAlign: 'right' }}>Version</span>
        </div>
        {db.FACTS.length === 0 && <EmptyState text="No atomic facts" hint="PDF-ingest / atomic-fact endpoint pending (P2)" />}
        {db.FACTS.map((f, i) => {
          const node = db.NODE_BY_ID[f.node]
          return (
            <div key={f.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 220px 60px 80px', padding: '12px 16px', alignItems: 'center', gap: 12, borderBottom: i === db.FACTS.length - 1 ? 'none' : '0.5px solid var(--hair-2)' }}>
              <KindGlyph kind="fact" />
              <div>
                <div style={{ font: '400 14px/1.5 var(--serif)', color: 'var(--ink)' }}>{f.text}</div>
                <div style={{ font: '500 11px var(--mono)', color: 'var(--ink-3)', marginTop: 2 }}>{f.pdf}.pdf</div>
              </div>
              <span style={{ font: '500 12.5px var(--sans)', color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node?.name}</span>
              <span style={{ font: '500 12px var(--mono)', color: 'var(--ink-3)', textAlign: 'right' }}>p.{f.page}</span>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span className="badge slate" style={{ height: 18, padding: '0 6px' }}><span className="d" />{f.version}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ───────────────────────── ANKI ─────────────────────────
export function AnkiView() {
  const db = useDB()
  const { status } = useStore()
  const target = db.TODAY.ankiTarget
  const due = db.ANKI_QUEUE.length
  const completed = db.TODAY.ankiCompleted
  // Adherence from live series when present, else mock figures.
  const seriesLive = status.live.has('anki-series')
  const daysAtTarget = db.ANKI_LOAD.filter((v) => v >= target).length
  const adherencePct = db.ANKI_LOAD.length ? Math.round((daysAtTarget / db.ANKI_LOAD.length) * 100) : 0

  return (
    <div className="content-scroll">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <h1 className="h1">Anki</h1>
          <p className="lede" style={{ marginTop: 6, maxWidth: 580 }}>Sync · queue · load adherence. Cards are scoped to the {db.COURSE.shortName} outline by the AnKing tag-shape parser.</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <StubButton name="anki-sync-now" className="tb-btn ghost">Sync now</StubButton>
          <StubButton name="anki-open-assignment" className="tb-btn primary">Open assignment</StubButton>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
        <StatCard label="Due today" value={due} accent="plum" sub="cards" footer={<div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}><span className="tnum">{Math.min(12, due)}</span> overdue · <span className="tnum">{Math.max(0, due - 12)}</span> due now</div>} />
        <StatCard label="Today's load" value={`${completed}/${target}`} accent="moss" sub="reviewed" footer={<div style={{ height: 4, borderRadius: 999, background: 'rgba(40,30,15,0.06)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${(completed / target) * 100}%`, background: 'var(--moss)' }} /></div>} />
        <StatCard label="Adherence" value={seriesLive ? `${adherencePct}%` : '—'} accent="clay" sub="last 30 days" footer={<div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}>{seriesLive ? <><span className="tnum">{daysAtTarget}</span> of {db.ANKI_LOAD.length} days at target</> : 'no adherence data'}</div>} />
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <h3 className="section-title" style={{ margin: 0 }}>Load adherence · daily reviews vs target {target}</h3>
          {status.live.has('anki-series')
            ? <span className="badge moss" style={{ height: 18, padding: '0 6px' }}><span className="d" />live</span>
            : <span className="stub-badge">no series</span>}
        </div>
        <div className="card" style={{ padding: '18px 18px 14px' }}>
          {db.ANKI_LOAD.length === 0 ? (
            <EmptyState text="No adherence series" hint={status.online ? 'review cards to build the daily series' : 'backend offline'} />
          ) : (
          <>
          <div style={{ position: 'relative', height: 140 }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '30%', height: 0, borderTop: '1px dashed var(--hair)' }} />
            <div style={{ position: 'absolute', right: 4, top: '30%', font: '500 10px var(--mono)', color: 'var(--ink-3)', transform: 'translateY(-50%)' }}>target · {target}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140 }}>
              {db.ANKI_LOAD.map((v, i) => {
                const h = (v / 100) * 140
                const isMiss = v < target * 0.5
                const isAbove = v >= target
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                    <div title={`day ${i + 1} · ${v} reviews`} style={{ height: h, width: '100%', background: v === 0 ? 'transparent' : isAbove ? 'var(--moss)' : isMiss ? 'oklch(0.75 0.08 30)' : 'var(--m2)', border: v === 0 ? '1px dashed var(--hair)' : 'none', borderRadius: '2px 2px 0 0', opacity: i === db.ANKI_LOAD.length - 1 ? 1 : 0.9 }} />
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, font: '500 11px var(--mono)', color: 'var(--ink-3)' }}>
            <span>30 days ago</span><span>15 days ago</span><span>today</span>
          </div>
          </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <h3 className="section-title" style={{ margin: 0 }}>Today's review queue · {due} cards</h3>
        {status.live.has('anki') && <span className="badge moss" style={{ height: 18, padding: '0 6px' }}><span className="d" />live</span>}
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {db.ANKI_QUEUE.length === 0 ? (
          <EmptyState text="No cards due" hint={status.live.has('anki') ? 'Anki review queue is empty — sync cards or check AnkiConnect' : 'backend offline'} />
        ) : db.ANKI_QUEUE.map((c, i) => {
          const node = c.node != null ? db.NODE_BY_ID[c.node] : null
          return (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 160px 70px 80px 70px', padding: '12px 16px', alignItems: 'center', gap: 12, borderBottom: i === db.ANKI_QUEUE.length - 1 ? 'none' : '0.5px solid var(--hair-2)', cursor: 'pointer' }}>
              <KindGlyph kind="anki" />
              <span style={{ font: '400 14px var(--serif)', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.front}</span>
              <span style={{ font: '500 12px var(--sans)', color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {node?.abbr && <span style={{ font: '600 10px var(--mono)', color: 'var(--ink-3)', padding: '1px 5px', background: 'rgba(40,30,15,0.05)', borderRadius: 4, marginRight: 6 }}>{node.abbr}</span>}
                {node?.name ?? '—'}
              </span>
              <span className="badge" style={{ height: 18, padding: '0 6px' }}><span className="d" style={{ background: masteryColor(c.retention) }} /><span className="tnum">{Math.round(c.retention * 100)}%</span></span>
              <span style={{ font: '500 12px var(--mono)', color: 'var(--ink-3)', textAlign: 'right' }}>{c.interval}</span>
              <span style={{ font: '500 12px var(--mono)', color: c.due === 'due now' ? 'var(--clay)' : 'var(--ink-3)', textAlign: 'right', whiteSpace: 'nowrap' }}>{c.due}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ───────────────────────── PDFs ─────────────────────────
export function PdfsView() {
  const db = useDB()
  const [selected, setSelected] = React.useState(db.PDFS[0]?.id)
  const pdf = db.PDFS.find((p) => p.id === selected) || db.PDFS[0]
  // No pdf_sources endpoint yet → empty-state (⊥ crash on pdf.sha / sample list).
  if (!pdf) {
    return (
      <div className="content-scroll">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <h1 className="h1">PDF inbox</h1>
            <p className="lede" style={{ marginTop: 6 }}>Ingested PDFs and the atomic facts extracted from them.</p>
          </div>
          <StubButton name="pdf-add" className="tb-btn primary"><Icon name="plus" size={11} color="var(--canvas)" /> Add</StubButton>
        </div>
        <div className="card">
          <EmptyState text="No PDFs" hint="PDF-ingest endpoint pending (P2)" />
        </div>
      </div>
    )
  }
  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <aside style={{ width: 360, borderRight: '0.5px solid var(--hair)', background: 'var(--wash)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '13px 16px 10px', borderBottom: '0.5px solid var(--hair)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="pdf" size={14} color="var(--ink-2)" />
          <span style={{ font: '600 13px var(--sans)', color: 'var(--ink)' }}>PDF inbox</span>
          <span style={{ marginLeft: 'auto' }}><StubButton name="pdf-add" className="tb-btn primary" style={{ height: 22, padding: '0 8px', font: '500 11px var(--sans)' }}><Icon name="plus" size={10} color="var(--canvas)" /> Add</StubButton></span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
          {db.PDFS.map((p) => {
            const node = p.node != null ? db.NODE_BY_ID[p.node] : null
            const isSel = p.id === selected
            const statusColor = ({ ingested: 'var(--moss)', extracting: 'var(--amber)', 'needs-tagging': 'oklch(0.62 0.18 30)' } as Record<string, string>)[p.status]
            return (
              <div key={p.id} onClick={() => setSelected(p.id)} style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: isSel ? 'var(--panel)' : 'transparent', border: isSel ? '0.5px solid var(--hair)' : '0.5px solid transparent', boxShadow: isSel ? 'var(--shadow-sm)' : 'none', marginBottom: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor }} />
                  <span style={{ font: '500 12.5px var(--sans)', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{p.filename}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 11px var(--sans)', color: 'var(--ink-3)' }}>
                  <span className="tnum">{p.pages}p</span> · <span className="tnum">{p.factsCount}</span> facts · <span>{p.ingestedAt}</span>
                </div>
                {node && <div style={{ marginTop: 5, font: '500 11px var(--sans)', color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>→ {node.name}</div>}
              </div>
            )
          })}
        </div>
      </aside>

      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px 36px', minWidth: 0 }}>
        <div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)', marginBottom: 4 }}>PDF · {pdf.sha}</div>
        <h1 className="h1" style={{ fontSize: 24 }}>{pdf.filename}</h1>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <span className="badge moss"><span className="d" />{pdf.status}</span>
          <span className="badge"><span className="d" /><span className="tnum">{pdf.pages}</span> pages</span>
          <span className="badge"><span className="d" /><span className="tnum">{pdf.factsCount}</span> atomic facts</span>
          <span className="badge slate"><span className="d" />ingested {pdf.ingestedAt}</span>
          <span className="stub-badge">no endpoint</span>
        </div>
        <div style={{ marginTop: 22 }}>
          <h3 className="section-title">Atomic facts · grounded to this PDF</h3>
          <div className="card" style={{ padding: 4 }}>
            {db.FACTS.map((f, i) => (
              <div key={f.id} className="item" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 100px', gap: 12, alignItems: 'center', padding: '11px 12px', borderBottom: i === db.FACTS.length - 1 ? 'none' : '0.5px solid var(--hair-2)' }}>
                <KindGlyph kind="fact" />
                <span style={{ font: '400 14px/1.5 var(--serif)', color: 'var(--ink)' }}>{f.text}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                  <span style={{ font: '500 11px var(--mono)', color: 'var(--ink-3)' }}>p.{f.page}</span>
                  <span className="badge slate" style={{ height: 18, padding: '0 6px' }}><span className="d" />{f.version}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ───────────────────────── NOTION ─────────────────────────
export function NotionView() {
  const db = useDB()
  return (
    <div className="content-scroll">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <h1 className="h1">Notion · write-out</h1>
          <p className="lede" style={{ marginTop: 6, maxWidth: 580 }}>One Notion page per outline node. Atomic facts and discriminators appear as blocks within the node's page. One-way sync; this app never reads Notion content back.</p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="stub-badge" title="NotionPage model exists; sync workflow is P2">no endpoint</span>
          <StubButton name="notion-sync-queue" className="tb-btn ghost">Sync queue</StubButton>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
        <StatCard label="Notion pages" value={db.NOTION_PAGES.length} accent="slate" sub={db.COURSE.nodeCount ? `of ${db.COURSE.nodeCount.toLocaleString()} nodes` : undefined} footer={<div style={{ height: 4, borderRadius: 999, background: 'rgba(40,30,15,0.06)', overflow: 'hidden' }}><div style={{ height: '100%', width: '0%', background: 'var(--slate)' }} /></div>} />
        <StatCard label="Blocks written" value="—" accent="ink" sub="across all pages" footer={<div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}>endpoint pending (P2)</div>} />
        <StatCard label="Pending writes" value="—" accent="amber" sub="awaiting sync" footer={<div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}>idempotent upsert</div>} />
      </div>

      <h3 className="section-title">Page index</h3>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 100px 120px 60px', padding: '10px 16px', font: '500 10.5px var(--sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', borderBottom: '0.5px solid var(--hair)' }}>
          <span>Page · outline node</span>
          <span style={{ textAlign: 'right' }}>Blocks</span>
          <span style={{ textAlign: 'right' }}>Status</span>
          <span style={{ textAlign: 'right' }}>Last synced</span>
          <span />
        </div>
        {db.NOTION_PAGES.length === 0 && <EmptyState text="No Notion pages" hint="notion_pages endpoint pending (P2)" />}
        {db.NOTION_PAGES.map((p, i) => {
          const node = db.NODE_BY_ID[p.node]
          return (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 100px 120px 60px', padding: '12px 16px', alignItems: 'center', gap: 12, borderBottom: i === db.NOTION_PAGES.length - 1 ? 'none' : '0.5px solid var(--hair-2)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <KindGlyph kind="notion" />
                <div>
                  <div style={{ font: '500 14px var(--sans)', color: 'var(--ink)' }}>{p.title}</div>
                  <div style={{ font: '500 11px var(--sans)', color: 'var(--ink-3)' }}>{node ? db.nodePath(p.node).join(' › ') : '—'}</div>
                </div>
              </div>
              <span className="mono" style={{ font: '500 12px var(--mono)', color: 'var(--ink-2)', textAlign: 'right' }}>{p.blocks}</span>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span className={`badge ${p.status === 'synced' ? 'moss' : 'amber'}`} style={{ height: 18, padding: '0 6px' }}><span className="d" />{p.status}</span>
              </div>
              <span style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)', textAlign: 'right' }}>{p.lastSynced}</span>
              <div style={{ textAlign: 'right' }}><Icon name="external" size={12} color="var(--ink-3)" /></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ───────────────────────── SESSION SUMMARY ─────────────────────────
export function SessionView() {
  const db = useDB()
  const { status, loadSessionSummary } = useStore()
  const s = db.SESSIONS[0]
  const wantLive = status.online && status.hasToken

  // Live session summary (¶T2): counts + accuracy + flagged + per-node rollup.
  const live = useAsync(
    () => (wantLive && s ? loadSessionSummary(s.id) : Promise.resolve(null)),
    [wantLive, s?.id]
  )
  const d = live.data
  const loading = wantLive && live.loading
  // No sessions (live empty) → real empty state, ⊥ crash on s.id (¶V1/¶V2)
  if (!s && !d) {
    return (
      <div className="content-scroll">
        <h1 className="h1">Sessions</h1>
        <div className="card" style={{ marginTop: 20 }}>
          <EmptyState text="No sessions yet" hint="capture attempts (extension / seed_dev) to build session history" />
        </div>
      </div>
    )
  }
  const testId = d?.testId ?? s?.id ?? '—'
  const attempts = d?.attempts ?? s?.items ?? 0
  const correct = d?.correct ?? s?.correct ?? 0
  const accuracy = d ? d.accuracy : (s && s.items ? s.correct / s.items : 0)
  const flaggedCount = d?.flaggedCount ?? 0
  const topicCount = d?.topicCount ?? 0
  // by_topic rows feed MasteryBars directly; empty until the live summary loads
  // (⊥ sample nodes).
  const coverageRows = d?.byTopic ?? []

  return (
    <div className="content-scroll">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}>Session · {testId}</span>
        {loading && <span className="skeleton" style={{ width: 70, height: 12, borderRadius: 4 }} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h1 className="h1">{attempts} questions · {correct} correct</h1>
          <p className="lede" style={{ marginTop: 6 }}>{s?.date ?? '—'} · {s?.time ?? '—'} wall-clock · {s?.source ?? 'uworld'} <span className="badge slate" style={{ marginLeft: 4 }}><span className="d" />{s?.source ?? 'uworld'}</span></p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <StubButton name="session-export-notion" className="tb-btn ghost">Export to Notion</StubButton>
          <StubButton name="session-review-flagged" className="tb-btn primary">Review flagged · {flaggedCount}</StubButton>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 22 }}>
        <StatCard label="Score" value={`${Math.round(accuracy * 100)}%`} accent="moss" footer={<div style={{ height: 4, borderRadius: 999, background: 'var(--m0)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${accuracy * 100}%`, background: 'var(--moss)' }} /></div>} />
        <StatCard label="Flagged" value={flaggedCount} accent="clay" sub="for review" footer={<div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}>from attempt notes</div>} />
        <StatCard label="Coverage" value={topicCount} accent="slate" sub="nodes touched" footer={<div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}>subtree-rolled per V-O1</div>} />
        <StatCard label="New connections" value="—" accent="plum" sub="discovered" footer={<div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}><span className="stub-badge">no endpoint</span> concept_edges P2</div>} />
      </div>

      <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <h3 className="section-title" style={{ margin: 0 }}>Per-question outcome</h3>
          <span className="stub-badge" title="no per-attempt correctness feed yet — summary returns aggregates only">no endpoint</span>
        </div>
        <div className="card" style={{ padding: '14px 16px' }}>
          <EmptyState text="No per-question outcomes" hint="per-attempt correctness endpoint pending — summary returns aggregates only" />
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3 className="section-title">Node coverage{d?.byTopic?.length ? ` · ${d.byTopic.length} nodes` : ''}</h3>
        <div className="card" style={{ padding: '14px 16px' }}>
          {coverageRows.length > 0
            ? <MasteryBars rows={coverageRows} />
            : <EmptyState text="No node coverage" hint={loading ? 'loading session summary…' : 'no per-node breakdown for this session'} />}
        </div>
      </div>
    </div>
  )
}

// ───────────────────────── CAPTURES ─────────────────────────
export function CapturesView() {
  const db = useDB()
  return (
    <div className="content-scroll">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <h1 className="h1">Captures</h1>
          <p className="lede" style={{ marginTop: 6 }}>Incoming questions from the Chrome extension (UWorld), manual entry, and PDF question-set parsers. Auto-categorized every 15 min.</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <StubButton name="captures-filter" className="tb-btn ghost"><Icon name="filter" size={11} /> Filter</StubButton>
          <StubButton name="captures-manual-entry" className="tb-btn primary"><Icon name="plus" size={11} color="var(--canvas)" /> Manual entry</StubButton>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 240px 80px 90px', padding: '10px 16px', font: '500 10.5px var(--sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', borderBottom: '0.5px solid var(--hair)' }}>
          <span>Capture id</span><span>Title</span><span>Tagged node</span>
          <span style={{ textAlign: 'center' }}>Status</span>
          <span style={{ textAlign: 'right' }}>When</span>
        </div>
        {db.CAPTURES.length === 0 && <EmptyState text="No captures" hint="incoming questions land here from the extension / manual entry" />}
        {db.CAPTURES.map((c, i) => {
          const node = c.node ? db.NODE_BY_ID[c.node] : null
          const statusBadge = ({ categorized: { cls: 'moss', label: 'tagged' }, 'needs-review': { cls: 'amber', label: 'needs review' }, uncategorized: { cls: 'flagged', label: 'untagged' } } as Record<string, { cls: string; label: string }>)[c.status]
          return (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 240px 80px 90px', padding: '11px 16px', alignItems: 'center', gap: 12, borderBottom: i === db.CAPTURES.length - 1 ? 'none' : '0.5px solid var(--hair-2)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mono" style={{ font: '500 12px var(--mono)', color: 'var(--ink)' }}>{c.id}</span>
                <span className="badge slate" style={{ height: 16, padding: '0 5px', font: '500 10px var(--sans)' }}><span className="d" />{c.source}</span>
              </div>
              <span style={{ font: '400 14px var(--serif)', color: 'var(--ink)' }}>
                {c.title}
                {c.isCorrect != null && <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4, font: '500 11.5px var(--sans)', color: c.isCorrect ? 'var(--moss)' : 'oklch(0.55 0.18 30)' }}><Icon name={c.isCorrect ? 'check' : 'x'} size={10} />{c.isCorrect ? 'correct' : 'wrong'}</span>}
                {c.flagged && <span style={{ marginLeft: 8, font: '500 11.5px var(--sans)', color: 'oklch(0.55 0.18 30)' }}><Icon name="flag" size={10} /> flagged</span>}
              </span>
              <span style={{ font: '500 12.5px var(--sans)', color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {node ? (<>{node.abbr && <span style={{ font: '600 10px var(--mono)', color: 'var(--ink-3)', padding: '1px 5px', background: 'rgba(40,30,15,0.05)', borderRadius: 4, marginRight: 6 }}>{node.abbr}</span>}{node.name}</>) : <span style={{ color: 'var(--ink-4)' }}>—</span>}
              </span>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <span className={`badge ${statusBadge.cls}`} style={{ height: 18, padding: '0 6px' }}><span className="d" />{statusBadge.label}</span>
              </div>
              <span style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)', textAlign: 'right' }}>{c.attemptedAt}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ───────────────────────── SETTINGS ─────────────────────────
export function SettingsView({ setView }: { setView: (v: View) => void }) {
  const db = useDB()
  const { status, loadSystemStatus } = useStore()

  // Live probes (¶T3): /tutor/healthz (DB) + /api/v1/admin/status (real
  // AnkiConnect/OpenAI/Notion reachability, backend T39).
  const sys = useAsync(
    () => (status.online && status.hasToken ? loadSystemStatus() : Promise.resolve(null)),
    [status.online, status.hasToken]
  )
  const probing = status.online && status.hasToken && sys.loading
  // reachable → connected; configured-but-down → offline; unconfigured → unknown
  const svc = (h?: { configured: boolean; reachable: boolean }) =>
    !h ? 'unknown' : h.reachable ? 'connected' : h.configured ? 'offline' : 'unknown'
  const d = sys.data
  const conns = [
    { name: 'Gradient API', desc: `${status.apiBase} · X-Coach-Token`, status: status.online ? 'connected' : 'offline', detail: status.online ? `${status.live.size} live data sources this session` : 'Unreachable — start uvicorn on :8000' },
    { name: 'Postgres', desc: 'app DB · asyncpg', status: d ? (d.dbReachable ? 'connected' : 'offline') : 'unknown', detail: d ? `${d.attemptCount.toLocaleString()} attempts recorded` : 'probing…' },
    { name: 'AnkiConnect', desc: '127.0.0.1:8765 · read + allowlisted writes', status: svc(d?.anki), detail: d?.anki.detail ?? (status.live.has('anki') ? `${db.ANKI_QUEUE.length} cards in review queue` : 'probing…') },
    { name: 'OpenAI', desc: 'tagging · calibrator · embeddings', status: svc(d?.openai), detail: d?.openai.detail ?? 'reachable' },
    { name: 'Notion', desc: 'Write-out only · one page per outline node', status: svc(d?.notion), detail: d?.notion.detail ?? (d?.notion.reachable ? 'token valid (write-out only)' : 'probing…') },
    { name: 'MCP host', desc: 'Socratic tutor seam · X-Coach-Token', status: status.hasToken ? 'connected' : 'no token', detail: status.hasToken ? 'X-Coach-Token present' : 'Set COACH_TOKEN in the environment' },
    { name: 'Chrome extension', desc: 'UWorld + generic web Qbank capture', status: 'unknown', detail: 'inbound only · POST /api/v1/captures' }
  ]
  const dot = (st: string) => (st === 'connected' ? 'var(--moss)' : st === 'offline' ? 'oklch(0.62 0.18 30)' : 'var(--amber)')

  return (
    <div className="content-scroll" style={{ maxWidth: 880 }}>
      <h1 className="h1">Settings</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 28, marginBottom: 10 }}>
        <h3 className="section-title" style={{ margin: 0 }}>Connections</h3>
        {probing && <span className="skeleton" style={{ width: 60, height: 12, borderRadius: 4 }} />}
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {conns.map((c, i) => (
          <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: 18, alignItems: 'center', padding: '14px 18px', borderBottom: i === conns.length - 1 ? 'none' : '0.5px solid var(--hair-2)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot(c.status), boxShadow: `0 0 0 2.5px color-mix(in oklch, ${dot(c.status)} 30%, transparent)` }} />
                <span style={{ font: '600 14px var(--sans)', color: 'var(--ink)' }}>{c.name}</span>
              </div>
              <div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)', marginTop: 3 }}>{c.desc}</div>
            </div>
            <div style={{ font: '400 13.5px var(--serif)', color: 'var(--ink-2)' }}>{c.detail}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <StubButton name="settings-test-connection" className="tb-btn ghost" style={{ height: 24 }}>Test</StubButton>
              <StubButton name="settings-connection-more" className="tb-btn" style={{ height: 24 }}><Icon name="more" size={12} /></StubButton>
            </div>
          </div>
        ))}
      </div>

      <h3 className="section-title" style={{ marginTop: 32 }}>Auth & tokens</h3>
      <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SettingsRow label="X-Coach-Token" hint="Shared secret the extension and MCP host send" value={status.hasToken ? 'set' : 'not set'} />
        <SettingsRow label="OpenAI API key" hint="Used by categorizer, calibrator, embeddings" value={d?.openai.configured ? 'configured' : 'not set'} />
        <SettingsRow label="Notion integration token" hint="Write-out only · scoped to Gradient workspace" value={d?.notion.configured ? 'configured' : 'not set'} />
        <SettingsRow label="API base URL" hint="Set GRADIENT_API_BASE to point elsewhere" value={status.apiBase} />
      </div>

      <h3 className="section-title" style={{ marginTop: 32 }}>Course management</h3>
      <div className="card" style={{ padding: 4 }}>
        <div className="item" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center', padding: '12px 14px' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, var(--clay), var(--amber))', display: 'grid', placeItems: 'center', color: 'white', font: '600 11px var(--sans)' }}>{db.COURSE.abbr}</div>
          <div>
            <div style={{ font: '600 14px var(--sans)', color: 'var(--ink)' }}>{db.COURSE.name}</div>
            <div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}>slug · <span className="mono">{db.COURSE.slug}</span> · {db.COURSE.nodeCount.toLocaleString()} nodes</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <StubButton name="course-reupload-schema" className="tb-btn ghost">Re-upload schema</StubButton>
            <StubButton name="course-export" className="tb-btn ghost">Export</StubButton>
          </div>
        </div>
        <div className="item" style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '11px 14px', borderTop: '0.5px solid var(--hair-2)', color: 'var(--ink-3)', cursor: 'pointer' }} onClick={() => setView('onboard')}>
          <Icon name="plus" size={13} />
          <span style={{ font: '500 13px var(--sans)' }}>Add a course (upload outline schema)</span>
        </div>
      </div>

      {/* Live backend status — moved off the sidebar to here, bottom-right */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 32, paddingTop: 14, borderTop: '0.5px solid var(--hair-2)', font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.online ? 'var(--moss)' : 'var(--ink-4)', boxShadow: status.online ? '0 0 0 2px var(--moss-2)' : '0 0 0 2px rgba(40,30,15,0.06)' }} />
        {status.online
          ? `API live · ${status.live.size} data sources · ${status.apiBase}`
          : 'Backend offline'}
      </div>
    </div>
  )
}

function SettingsRow({ label, hint, value }: { label: string; hint: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: 16, alignItems: 'center' }}>
      <div>
        <div style={{ font: '600 13px var(--sans)', color: 'var(--ink)' }}>{label}</div>
        <div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)', marginTop: 1 }}>{hint}</div>
      </div>
      <div style={{ padding: '7px 11px', background: 'var(--sunken)', border: '0.5px solid var(--hair)', borderRadius: 7, font: '500 12.5px var(--mono)', color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      <div style={{ display: 'flex', gap: 4 }}>
        <StubButton name="settings-reveal-secret" className="tb-btn ghost" style={{ height: 26 }}>Reveal</StubButton>
        <StubButton name="settings-rotate-secret" className="tb-btn ghost" style={{ height: 26 }}>Rotate</StubButton>
      </div>
    </div>
  )
}

// ───────────────────────── ONBOARDING ─────────────────────────
export function OnboardingView({ setView }: { setView: (v: View) => void }) {
  const { createCourse, importOutline } = useStore()
  const [step, setStep] = React.useState(1)
  const [slug, setSlug] = React.useState('')
  const [name, setName] = React.useState('')
  const [schema, setSchema] = React.useState<unknown | null>(null)
  const [fileName, setFileName] = React.useState<string>('')
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    try {
      const parsed = JSON.parse(await file.text())
      setSchema(parsed)
      if (parsed?.course?.slug) setSlug(parsed.course.slug)
      if (parsed?.course?.name) setName(parsed.course.name)
      setStep(3)
      setResult(null)
    } catch {
      setResult('Could not parse file as JSON.')
    }
  }

  const materialize = async () => {
    if (!schema) { setResult('Pick a schema file first.'); return }
    setBusy(true); setResult(null)
    const course = await createCourse(slug, name)
    if (!course) { setBusy(false); setResult('Create course failed (slug may already exist, or backend offline).'); return }
    const ok = await importOutline(course.id, schema)
    setBusy(false)
    if (ok) { setStep(4); setResult(`Materialized course #${course.id} · ${slug}.`) }
    else setResult('Outline import rejected — check the schema shape.')
  }

  const steps = [
    { i: 1, label: 'Course details' }, { i: 2, label: 'Upload schema' },
    { i: 3, label: 'Validate' }, { i: 4, label: 'Materialize' }
  ]

  return (
    <div className="content-scroll" style={{ maxWidth: 760 }}>
      <h1 className="h1">Add a course</h1>
      <p className="lede" style={{ marginTop: 6 }}>Upload an outline schema generated from your sources (PDFs, screenshots, syllabus). Gradient validates the tree, then materializes it as the course's outline.</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 28, marginBottom: 24 }}>
        {steps.map((s, idx, arr) => (
          <React.Fragment key={s.i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', background: step >= s.i ? 'var(--clay)' : step === s.i - 1 ? 'var(--clay-2)' : 'rgba(40,30,15,0.05)', color: step >= s.i ? 'white' : step === s.i - 1 ? 'var(--clay)' : 'var(--ink-3)', font: '600 11px var(--sans)', border: step === s.i ? '0' : '0.5px solid var(--hair)' }}>
                {step > s.i ? <Icon name="check" size={11} color="white" /> : s.i}
              </span>
              <span style={{ font: step >= s.i ? '600 12.5px var(--sans)' : '500 12.5px var(--sans)', color: step >= s.i ? 'var(--ink)' : 'var(--ink-3)', whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
            {idx < arr.length - 1 && <div style={{ flex: 1, height: 0.5, background: step > s.i ? 'var(--clay)' : 'var(--hair)', margin: '0 14px' }} />}
          </React.Fragment>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--hair-2)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--wash)' }}>
          <Icon name="check" size={14} color="var(--moss)" />
          <span style={{ font: '500 13px var(--sans)', color: 'var(--ink-2)', flex: 1 }}>
            <input value={name} placeholder="Course name" onChange={(e) => setName(e.target.value)} style={{ font: '600 13px var(--sans)', color: 'var(--ink)', border: 0, background: 'transparent', outline: 'none', width: 160 }} /> ·
            slug <input value={slug} placeholder="course-slug" onChange={(e) => setSlug(e.target.value)} className="mono" style={{ font: '500 12px var(--mono)', color: 'var(--ink-2)', border: 0, background: 'transparent', outline: 'none', width: 130 }} />
          </span>
          <button className="tb-btn ghost" style={{ height: 24 }} onClick={() => setStep(1)}>Edit</button>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span className="badge clay" style={{ height: 20, padding: '0 8px' }}><span className="d" />step {step} of 4</span>
            <h2 className="h2" style={{ font: '500 18px var(--serif)' }}>Upload outline schema</h2>
          </div>
          <p style={{ font: '400 14px/1.6 var(--serif)', color: 'var(--ink-2)', margin: '0 0 18px', maxWidth: 580 }}>
            Generate your schema via the prompt at <span className="mono" style={{ color: 'var(--clay)', borderBottom: '0.5px solid var(--clay)' }}>docs/PROMPT_OUTLINE_SCHEMA.md</span> in your LLM of choice, then drop the file here. Validate-then-materialize is atomic — a malformed schema rejects the whole upload.
          </p>

          <input ref={fileRef} type="file" accept=".json,.yaml,.yml" style={{ display: 'none' }} onChange={onFile} />
          <div onClick={() => fileRef.current?.click()} style={{ border: '1.5px dashed var(--hair)', background: 'var(--wash)', borderRadius: 12, padding: '32px 20px', textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ font: '500 32px var(--serif)', color: 'var(--ink-3)', marginBottom: 8 }}>⤓</div>
            <div style={{ font: '500 14px var(--sans)', color: 'var(--ink)', marginBottom: 4 }}>{fileName ? <>Selected <span className="mono">{fileName}</span></> : <>Drop <span className="mono">schema.json</span> here</>}</div>
            <div style={{ font: '500 12px var(--sans)', color: 'var(--ink-3)', marginBottom: 14 }}>or click to browse · accepts <span className="mono">.json</span></div>
            <button className="tb-btn primary" onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}>Browse files</button>
          </div>

          <div style={{ marginTop: 18, font: '500 11.5px var(--sans)', color: 'var(--ink-3)', padding: '10px 12px', background: 'var(--sunken)', borderRadius: 7, border: '0.5px solid var(--hair)' }}>
            <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>Expected shape · </span>
            <span className="mono" style={{ color: 'var(--ink-2)' }}>{`{ course: {slug, name}, nodes: [{path: [..], kind, name, position?}, ...] }`}</span>
          </div>

          {result && <div className="banner" style={{ marginTop: 14, background: result.startsWith('Materialized') ? 'var(--moss-2)' : 'var(--amber-2)', borderColor: result.startsWith('Materialized') ? 'var(--moss)' : 'var(--amber)', color: result.startsWith('Materialized') ? 'oklch(0.40 0.10 145)' : 'oklch(0.42 0.10 65)' }}>{result}</div>}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '0.5px solid var(--hair-2)', display: 'flex', gap: 6, justifyContent: 'flex-end', background: 'var(--wash)' }}>
          <button className="tb-btn" onClick={() => setView('home')}>Cancel</button>
          <button className="tb-btn ghost" onClick={() => setStep((s) => Math.max(1, s - 1))}>Back</button>
          <button className="tb-btn primary" onClick={materialize} disabled={busy}>
            {busy ? 'Materializing…' : 'Validate + materialize'} <Icon name="arrow-r" size={11} color="var(--canvas)" />
          </button>
        </div>
      </div>
    </div>
  )
}
