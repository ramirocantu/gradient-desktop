import React from 'react'
import { Icon, KindGlyph, MasteryViz, MasteryBars, LinkRail, EmptyState, StubButton } from '../components/primitives'
import { masteryColor, masteryLabel } from '../helpers'
import { useDB, useStore } from '../data/store'
import { useAsync } from '../data/useAsync'
import type { Tweaks } from '../types'
import type { View } from '.'

export function OutlineView({ tweaks, setView }: { tweaks: Tweaks; setView: (v: View) => void }) {
  const db = useDB()
  const { loadNodeMastery } = useStore()
  const childrenOf = (id: number) => db.OUTLINE.filter((n) => n.parent === id)
  const rootNodes = db.OUTLINE.filter((n) => n.parent === null)
  const firstLeaf = db.OUTLINE.find((n) => n.current) ?? rootNodes[0]
  const [expanded, setExpanded] = React.useState<Set<number>>(() => {
    // expand the path to the initially-selected node
    const s = new Set<number>()
    let cur = firstLeaf
    while (cur && cur.parent != null) { s.add(cur.parent); cur = db.NODE_BY_ID[cur.parent] }
    rootNodes.forEach((r) => s.add(r.id))
    return s
  })
  const [selected, setSelected] = React.useState<number>(firstLeaf?.id ?? rootNodes[0]?.id)
  const toggle = (id: number) => setExpanded((prev) => {
    const s = new Set(prev)
    s.has(id) ? s.delete(id) : s.add(id)
    return s
  })

  const render: typeof db.OUTLINE = []
  const visit = (n: (typeof db.OUTLINE)[number]) => {
    render.push(n)
    if (expanded.has(n.id)) childrenOf(n.id).forEach(visit)
  }
  rootNodes.forEach(visit)

  const sel = db.NODE_BY_ID[selected]
  // ¶T7: live subtree mastery for the browsed node (self + children) overlays
  // the 0 baseline; course endpoint only covers roots, this fills deeper nodes.
  const nm = useAsync(() => loadNodeMastery(selected), [selected])
  const liveMast = nm.data?.byId ?? {}
  const mast = (id: number, fallback: number) => liveMast[id] ?? fallback
  const subtreeChildren = childrenOf(selected).map((c) => ({ ...c, mastery: mast(c.id, c.mastery) }))

  // Empty base / offline → no outline. Render an honest empty-state (⊥ crash on
  // undefined `sel`, ⊥ sample tree).
  if (rootNodes.length === 0 || !sel) {
    return (
      <div className="content-scroll">
        <h1 className="h1">Outline</h1>
        <div className="card" style={{ marginTop: 20 }}>
          <EmptyState text="No outline loaded" hint="import a course outline (Settings → Add a course) or start the backend" />
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
      <aside style={{ width: 320, flexShrink: 0, borderRight: '0.5px solid var(--hair)', background: 'var(--wash)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '13px 16px 10px', borderBottom: '0.5px solid var(--hair)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="outline" size={14} color="var(--ink-2)" />
          <span style={{ font: '600 13px var(--sans)', color: 'var(--ink)' }}>{db.COURSE.shortName} outline</span>
          <span className="badge" style={{ marginLeft: 'auto' }}><span className="d" />{db.COURSE.nodeCount.toLocaleString()}</span>
        </div>
        <div style={{ padding: '8px 12px', borderBottom: '0.5px solid var(--hair-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', background: 'var(--panel)', border: '0.5px solid var(--hair)', borderRadius: 7 }}>
            <Icon name="search" size={12} color="var(--ink-3)" />
            <input placeholder="Search nodes…" style={{ flex: 1, border: 0, background: 'transparent', font: '500 12.5px var(--sans)', color: 'var(--ink)', outline: 'none' }} />
            <span className="kbd">⌘F</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {render.map((n) => {
            const hasChildren = childrenOf(n.id).length > 0
            const isOpen = expanded.has(n.id)
            const isSel = selected === n.id
            return (
              <div key={n.id} onClick={() => setSelected(n.id)} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 6, alignItems: 'center', padding: '4px 14px 4px 6px', marginLeft: n.depth * 16, cursor: 'pointer', background: isSel ? 'var(--clay-2)' : 'transparent', borderRadius: 6, marginRight: 8 }}>
                <span onClick={(e) => { e.stopPropagation(); if (hasChildren) toggle(n.id) }} style={{ width: 14, display: 'grid', placeItems: 'center', color: 'var(--ink-3)', opacity: hasChildren ? 1 : 0 }}>
                  <Icon name={isOpen ? 'chevron-d' : 'chevron-r'} size={10} />
                </span>
                <span style={{ font: `${n.kind === 'section' ? '600' : '500'} 12.5px var(--sans)`, color: isSel ? 'var(--ink)' : 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {n.abbr && <span className="mono" style={{ font: '600 9.5px var(--mono)', color: 'var(--ink-3)', padding: '1px 4px', background: 'rgba(40,30,15,0.05)', borderRadius: 3 }}>{n.abbr}</span>}
                  {n.name}
                </span>
                <span style={{ width: 28, height: 4, borderRadius: 999, background: 'var(--m0)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${mast(n.id, n.mastery) * 100}%`, background: masteryColor(mast(n.id, n.mastery)) }} />
                </span>
              </div>
            )
          })}
        </div>
      </aside>

      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px 36px', minWidth: 0 }}>
        <NodeBreadcrumbs id={selected} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginTop: 6 }}>
          <div style={{ flex: 1 }}>
            <h1 className="h1" style={{ fontSize: 26 }}>{sel?.name}</h1>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              <span className="badge slate"><span className="d" />{sel?.kind}</span>
              <span className="badge"><span className="d" />{sel?.items} items</span>
              <span className="badge moss"><span className="d" style={{ background: masteryColor(mast(sel.id, sel?.mastery ?? 0)) }} />{Math.round(mast(sel.id, sel?.mastery ?? 0) * 100)}% mastery · {masteryLabel(mast(sel.id, sel?.mastery ?? 0))}</span>
              <span className="badge slate"><span className="d" /><Icon name="notion" size={9} color="var(--slate)" /> notion · {sel?.name?.slice(0, 14)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <StubButton name="node-open-in-notion" className="tb-btn ghost"><Icon name="external" size={11} /> Open in Notion</StubButton>
            <StubButton name="node-study-this" className="tb-btn primary"><Icon name="spark" size={11} color="var(--canvas)" /> Study this</StubButton>
          </div>
        </div>

        {subtreeChildren.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <h3 className="section-title">Subtree · {subtreeChildren.length} children</h3>
            <div className="card" style={{ padding: '14px 16px' }}>
              <MasteryViz kind={tweaks.masteryViz} rows={subtreeChildren} onSelect={(id) => setSelected(id)} />
            </div>
          </div>
        )}

        <NodeItemsTabs />
      </div>
    </div>
  )
}

export function NodeBreadcrumbs({ id }: { id: number }) {
  const db = useDB()
  const path = db.nodePath(id)
  return (
    <div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {path.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: 'var(--ink-4)' }}>›</span>}
          <span style={{ color: i === path.length - 1 ? 'var(--ink-2)' : 'var(--ink-3)', fontWeight: i === path.length - 1 ? 600 : 500, whiteSpace: 'nowrap' }}>{p}</span>
        </React.Fragment>
      ))}
    </div>
  )
}

function NodeItemsTabs() {
  const db = useDB()
  const [tab, setTab] = React.useState('questions')
  const tabs = [
    { id: 'questions', label: 'Questions', count: 0 },
    { id: 'anki', label: 'Anki cards', count: db.ANKI_QUEUE.length },
    { id: 'facts', label: 'Atomic facts', count: db.FACTS.length },
    { id: 'discrim', label: 'Discriminators', count: db.DISCRIMINATORS.length },
    { id: 'links', label: 'Linked nodes', count: db.CONNECTIONS.length }
  ]
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', gap: 0, borderBottom: '0.5px solid var(--hair)' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: 'none', border: 0, padding: '10px 16px 11px', font: tab === t.id ? '600 13px var(--sans)' : '500 13px var(--sans)', color: tab === t.id ? 'var(--ink)' : 'var(--ink-3)', cursor: 'pointer', borderBottom: tab === t.id ? '1.5px solid var(--clay)' : '1.5px solid transparent', marginBottom: '-0.5px', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            {t.label}
            <span className="mono" style={{ font: '500 10px var(--mono)', color: tab === t.id ? 'var(--clay)' : 'var(--ink-3)', padding: '1px 5px', background: tab === t.id ? 'var(--clay-2)' : 'rgba(40,30,15,0.05)', borderRadius: 999 }}>{t.count}</span>
          </button>
        ))}
      </div>
      <div style={{ padding: '18px 0' }}>
        {tab === 'questions' && <NodeQuestionsList />}
        {tab === 'anki' && <NodeAnkiList />}
        {tab === 'facts' && <NodeFactsList />}
        {tab === 'discrim' && <NodeDiscriminatorsList />}
        {tab === 'links' && (db.CONNECTIONS.length === 0
          ? <div className="card"><EmptyState text="No linked nodes" hint="no concept edges derived yet (similarity/manual)" /></div>
          : <LinkRail items={db.CONNECTIONS} />)}
      </div>
    </div>
  )
}

function NodeQuestionsList() {
  // No per-node questions endpoint yet — honest empty-state (⊥ sample rows).
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <EmptyState text="No questions for this node" hint="per-node question listing endpoint pending" />
    </div>
  )
}

function NodeAnkiList() {
  const db = useDB()
  if (db.ANKI_QUEUE.length === 0) {
    return <div className="card"><EmptyState text="No Anki cards" hint="sync cards via AnkiConnect" /></div>
  }
  return (
    <div className="card" style={{ padding: 4 }}>
      {db.ANKI_QUEUE.slice(0, 5).map((c, i) => (
        <div key={c.id} className="item" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', gap: 12, alignItems: 'center', padding: '10px 12px', borderBottom: i === 4 ? 'none' : '0.5px solid var(--hair-2)' }}>
          <KindGlyph kind="anki" />
          <span style={{ font: '400 14px var(--serif)', color: 'var(--ink)' }}>{c.front}</span>
          <span className="badge" style={{ height: 18, padding: '0 6px' }}><span className="d" style={{ background: masteryColor(c.retention) }} /><span className="tnum">{Math.round(c.retention * 100)}%</span></span>
          <span style={{ font: '500 11px var(--mono)', color: 'var(--ink-3)' }}>{c.interval}</span>
          <span style={{ font: '500 11px var(--mono)', color: c.due === 'due now' ? 'var(--clay)' : 'var(--ink-3)' }}>{c.due}</span>
        </div>
      ))}
    </div>
  )
}

export function NodeFactsList() {
  const db = useDB()
  if (db.FACTS.length === 0) {
    return <div className="card"><EmptyState text="No atomic facts" hint="PDF-ingest / atomic-fact endpoint pending (P2)" /></div>
  }
  return (
    <div className="card" style={{ padding: 4 }}>
      {db.FACTS.map((f, i) => (
        <div key={f.id} className="item" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center', padding: '10px 12px', borderBottom: i === db.FACTS.length - 1 ? 'none' : '0.5px solid var(--hair-2)' }}>
          <KindGlyph kind="fact" />
          <span style={{ font: '400 14px/1.5 var(--serif)', color: 'var(--ink)' }}>{f.text}</span>
          <span style={{ font: '500 11px var(--mono)', color: 'var(--ink-3)' }}>{f.pdf} · p.{f.page}</span>
        </div>
      ))}
    </div>
  )
}

function NodeDiscriminatorsList() {
  const db = useDB()
  if (db.DISCRIMINATORS.length === 0) {
    return <div className="card"><EmptyState text="No discriminators" hint="discriminator listing endpoint pending (P2)" /></div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {db.DISCRIMINATORS.map((d) => (
        <div key={d.id} className="card" style={{ padding: '13px 15px', background: 'linear-gradient(180deg, var(--clay-2) 0%, var(--panel) 60%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="badge clay" style={{ height: 18, padding: '0 6px' }}><span className="d" />discriminator</span>
            <span className="mono" style={{ font: '500 11px var(--mono)', color: 'var(--ink-3)' }}>Q · {d.question}</span>
            <span style={{ marginLeft: 'auto', font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}>{d.when}</span>
          </div>
          <p style={{ font: '400 14.5px/1.55 var(--serif)', color: 'var(--ink)', margin: 0, textWrap: 'pretty' } as React.CSSProperties}>"{d.factor}"</p>
        </div>
      ))}
    </div>
  )
}

export function NodeDetailView() {
  const db = useDB()
  const sel = db.OUTLINE.find((n) => n.current) ?? db.OUTLINE[0]
  if (!sel) {
    return (
      <div className="content-scroll">
        <h1 className="h1">Node</h1>
        <div className="card" style={{ marginTop: 20 }}>
          <EmptyState text="No node selected" hint="browse the outline to open a node" />
        </div>
      </div>
    )
  }
  return (
    <div className="content-scroll">
      <NodeBreadcrumbs id={sel.id} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginTop: 8 }}>
        <div style={{ flex: 1 }}>
          <h1 className="h1">{sel.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <StubButton name="node-open-in-notion" className="tb-btn ghost"><Icon name="external" size={11} /> Notion</StubButton>
          <StubButton name="node-study-this" className="tb-btn primary"><Icon name="spark" size={11} color="var(--canvas)" /> Study</StubButton>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 22 }}>
        <MiniStat label="Mastery" value={`${Math.round(sel.mastery * 100)}%`} hint={masteryLabel(sel.mastery)} fill={masteryColor(sel.mastery)} />
        <MiniStat label="Questions" value="—" hint="endpoint pending" />
        <MiniStat label="Anki cards" value={String(db.ANKI_QUEUE.length)} hint="in review queue" />
        <MiniStat label="Atomic facts" value="—" hint="endpoint pending (P2)" />
      </div>

      <NodeItemsTabs />
    </div>
  )
}

function MiniStat({ label, value, hint, fill }: { label: string; value: string; hint: string; fill?: string }) {
  return (
    <div className="card" style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: fill || 'var(--ink-3)' }} />
        <span style={{ font: '500 10.5px var(--sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{label}</span>
      </div>
      <div style={{ font: '500 22px var(--serif)', color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', marginBottom: 2 }}>{value}</div>
      <div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)' }}>{hint}</div>
    </div>
  )
}
