// Shared UI atoms — ported from the design proposal's primitives.jsx.
// window.masteryColor → imported helper; window globals → props/imports.
import React from 'react'
import { masteryColor } from '../helpers'

type CSS = React.CSSProperties

export const Icon = ({
  name,
  size = 16,
  color = 'currentColor',
  style = {}
}: {
  name: string
  size?: number
  color?: string
  style?: CSS
}) => {
  const s = size
  const p = {
    width: s,
    height: s,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    strokeWidth: 1.3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  }
  switch (name) {
    case 'home': return (<svg {...p} style={style}><path d="M2.5 7L8 2.5L13.5 7v6.5h-3v-4h-4v4h-3z" /></svg>)
    case 'queue': return (<svg {...p} style={style}><path d="M3 4h10M3 8h10M3 12h6" /></svg>)
    case 'outline': return (<svg {...p} style={style}><path d="M3 4h2v2H3zM3 10h2v2H3zM7 5h6M7 11h6" /></svg>)
    case 'node': return (<svg {...p} style={style}><circle cx="4" cy="4" r="1.5" /><circle cx="12" cy="12" r="1.5" /><path d="M5 5l6 6" /></svg>)
    case 'anki': return (<svg {...p} style={style}><rect x="3" y="3" width="8" height="10" rx="1.5" /><path d="M5 5h4M5 8h4M5 11h2" /></svg>)
    case 'pdf': return (<svg {...p} style={style}><path d="M4 2h5l3 3v9H4z" /><path d="M9 2v3h3" /></svg>)
    case 'notion': return (<svg {...p} style={style}><rect x="3" y="2.5" width="10" height="11" rx="1" /><path d="M5 5l6 6M5 11V5l6 6" /></svg>)
    case 'captures': return (<svg {...p} style={style}><circle cx="8" cy="8" r="4.5" /><path d="M8 3.5v-1M8 13.5v-1M3.5 8h-1M13.5 8h-1" /></svg>)
    case 'session': return (<svg {...p} style={style}><circle cx="8" cy="8" r="5.5" /><path d="M8 5v3l2 1.5" /></svg>)
    case 'settings': return (<svg {...p} style={style}><circle cx="8" cy="8" r="2" /><path d="M8 2v1M8 13v1M2 8h1M13 8h1M3.8 3.8l.8.8M11.4 11.4l.8.8M3.8 12.2l.8-.8M11.4 4.6l.8-.8" /></svg>)
    case 'search': return (<svg {...p} style={style}><circle cx="7" cy="7" r="4" /><path d="M10 10l3 3" /></svg>)
    case 'flag': return (<svg {...p} style={style}><path d="M4 14V2.5h7l-1 2 1 2H4" /></svg>)
    case 'link': return (<svg {...p} style={style}><path d="M6.5 9.5l3-3M6 4.5L7.5 3a2.5 2.5 0 014 4L10 8.5M10 11.5L8.5 13a2.5 2.5 0 01-4-4L6 7.5" /></svg>)
    case 'spark': return (<svg {...p} style={style}><path d="M8 2v3M8 11v3M3 8h3M10 8h3M4.5 4.5l1.5 1.5M10 10l1.5 1.5M4.5 11.5L6 10M10 6l1.5-1.5" /></svg>)
    case 'plus': return (<svg {...p} style={style}><path d="M8 3v10M3 8h10" /></svg>)
    case 'chevron-r': return (<svg {...p} style={style}><path d="M6 3l4 5-4 5" /></svg>)
    case 'chevron-d': return (<svg {...p} style={style}><path d="M3 6l5 4 5-4" /></svg>)
    case 'chevron-u': return (<svg {...p} style={style}><path d="M3 10l5-4 5 4" /></svg>)
    case 'check': return (<svg {...p} style={style}><path d="M3 8l3 3 7-7" /></svg>)
    case 'x': return (<svg {...p} style={style}><path d="M4 4l8 8M12 4l-8 8" /></svg>)
    case 'circle': return (<svg {...p} style={style}><circle cx="8" cy="8" r="4.5" /></svg>)
    case 'arrow-r': return (<svg {...p} style={style}><path d="M3 8h10M9 4l4 4-4 4" /></svg>)
    case 'arrow-ur': return (<svg {...p} style={style}><path d="M5 11l6-6M6 5h5v5" /></svg>)
    case 'filter': return (<svg {...p} style={style}><path d="M2.5 3h11l-4 5v5l-3-1.5V8z" /></svg>)
    case 'more': return (<svg {...p} style={style}><circle cx="3.5" cy="8" r="1" /><circle cx="8" cy="8" r="1" /><circle cx="12.5" cy="8" r="1" /></svg>)
    case 'external': return (<svg {...p} style={style}><path d="M9 3h4v4M13 3L7 9M11 9v4H3V5h4" /></svg>)
    case 'doc': return (<svg {...p} style={style}><path d="M4 2h5l3 3v9H4z" /><path d="M6 7h4M6 9h4M6 11h3" /></svg>)
    case 'spark-line': return (<svg {...p} style={style}><path d="M2 11l3-4 3 2 3-5 3 3" /></svg>)
    case 'logo': return (
      <svg viewBox="0 0 16 16" width={s} height={s} style={style}>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.14 45)" />
            <stop offset="50%" stopColor="oklch(0.72 0.13 80)" />
            <stop offset="100%" stopColor="oklch(0.60 0.10 145)" />
          </linearGradient>
        </defs>
        <circle cx="8" cy="8" r="6" fill="url(#lg)" />
      </svg>
    )
    default: return null
  }
}

export function KindGlyph({ kind, size = 14 }: { kind: string; size?: number }) {
  const map: Record<string, { color: string; letter: string }> = {
    question: { color: 'var(--clay)', letter: 'Q' },
    anki: { color: 'var(--plum)', letter: 'A' },
    fact: { color: 'var(--moss)', letter: 'F' },
    node: { color: 'var(--slate)', letter: 'N' },
    pdf: { color: 'var(--amber)', letter: 'P' },
    notion: { color: 'var(--ink-2)', letter: '↗' }
  }
  const c = map[kind] || { color: 'var(--ink-3)', letter: '·' }
  return (
    <span style={{
      display: 'inline-grid', placeItems: 'center',
      width: size, height: size, borderRadius: 3,
      background: c.color, color: 'white',
      font: `600 ${size - 4}px var(--sans)`, letterSpacing: 0, flexShrink: 0
    }}>{c.letter}</span>
  )
}

interface Row { id: number; name: string; mastery: number; items: number; abbr?: string }
interface VizProps { rows: Row[]; onSelect?: (id: number) => void; focusId?: number }

const abbrChip = (abbr?: string, mr = 0): React.ReactNode => abbr ? (
  <span style={{
    font: '600 10px var(--mono)', color: 'var(--ink-3)',
    padding: '1px 5px', background: 'rgba(40,30,15,0.05)', borderRadius: 4,
    marginRight: mr
  }}>{abbr}</span>
) : null

export function MasteryHeatmap({ rows, onSelect, focusId, compact = false }: VizProps & { compact?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `minmax(160px,220px) 1fr ${compact ? '44px' : '56px'}`, gap: 0 }}>
      {rows.map((r) => {
        const cells = 24
        const filled = Math.round(r.mastery * cells)
        return (
          <React.Fragment key={r.id}>
            <div onClick={() => onSelect?.(r.id)} style={{
              padding: '9px 12px 9px 0', font: '500 13px var(--sans)',
              color: focusId === r.id ? 'var(--ink)' : 'var(--ink-2)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, fontWeight: focusId === r.id ? 600 : 500
            }}>
              {abbrChip(r.abbr)}
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cells}, 1fr)`, gap: 2, padding: '9px 16px 9px 0', alignItems: 'center' }}>
              {Array.from({ length: cells }, (_, i) => {
                const isFilled = i < filled
                const isEdge = i === filled - 1
                return (<div key={i} style={{
                  height: 14, borderRadius: 2,
                  background: isFilled ? (isEdge ? 'var(--m3)' : masteryColor(r.mastery)) : 'var(--m0)',
                  opacity: isFilled ? 1 : 0.7
                }} />)
              })}
            </div>
            <div style={{ padding: '9px 0', font: '500 12px var(--mono)', color: 'var(--ink-3)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(r.mastery * 100)}%
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

export function MasteryBars({ rows, onSelect, focusId }: VizProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map((r) => (
        <div key={r.id} onClick={() => onSelect?.(r.id)} style={{ display: 'grid', gridTemplateColumns: 'minmax(180px,240px) 1fr 60px', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
          <div style={{ font: '500 13px var(--sans)', color: focusId === r.id ? 'var(--ink)' : 'var(--ink-2)', fontWeight: focusId === r.id ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {abbrChip(r.abbr, 8)}{r.name}
          </div>
          <div style={{ height: 18, background: 'var(--m0)', borderRadius: 4, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, width: `${r.mastery * 100}%`, background: masteryColor(r.mastery), borderRadius: 4 }} />
            <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, display: 'flex', alignItems: 'center', font: '500 11px var(--mono)', color: 'rgba(40,30,15,0.55)', fontVariantNumeric: 'tabular-nums' }}>{r.items} items</div>
          </div>
          <div style={{ font: '500 12px var(--mono)', color: 'var(--ink-3)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(r.mastery * 100)}%</div>
        </div>
      ))}
    </div>
  )
}

export function MasteryDots({ rows, onSelect, focusId }: VizProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((r) => {
        const total = Math.min(60, Math.max(10, Math.round(r.items / 4)))
        const lit = Math.round(r.mastery * total)
        return (
          <div key={r.id} onClick={() => onSelect?.(r.id)} style={{ display: 'grid', gridTemplateColumns: 'minmax(180px,240px) 1fr 60px', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ font: '500 13px var(--sans)', color: focusId === r.id ? 'var(--ink)' : 'var(--ink-2)', fontWeight: focusId === r.id ? 600 : 500 }}>
              {abbrChip(r.abbr, 8)}{r.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${total}, 1fr)`, gap: 3 }}>
              {Array.from({ length: total }, (_, i) => (
                <div key={i} style={{ width: '100%', aspectRatio: '1', borderRadius: '50%', background: i < lit ? masteryColor(r.mastery) : 'var(--m0)', opacity: i < lit ? 1 : 0.6 }} />
              ))}
            </div>
            <div style={{ font: '500 12px var(--mono)', color: 'var(--ink-3)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(r.mastery * 100)}%</div>
          </div>
        )
      })}
    </div>
  )
}

export function MasterySunburst({ rows, onSelect, focusId }: VizProps) {
  const total = rows.reduce((s, r) => s + r.items, 0) || 1
  const r1 = 60, r2 = 92, r3 = 130, cx = 150, cy = 150
  let acc = 0
  const segs = rows.map((r) => {
    const start = (acc / total) * Math.PI * 2
    acc += r.items
    const end = (acc / total) * Math.PI * 2
    return { row: r, start, end }
  })
  const arcPath = (rIn: number, rOut: number, a0: number, a1: number) => {
    const x0 = cx + rOut * Math.cos(a0 - Math.PI / 2), y0 = cy + rOut * Math.sin(a0 - Math.PI / 2)
    const x1 = cx + rOut * Math.cos(a1 - Math.PI / 2), y1 = cy + rOut * Math.sin(a1 - Math.PI / 2)
    const x2 = cx + rIn * Math.cos(a1 - Math.PI / 2), y2 = cy + rIn * Math.sin(a1 - Math.PI / 2)
    const x3 = cx + rIn * Math.cos(a0 - Math.PI / 2), y3 = cy + rIn * Math.sin(a0 - Math.PI / 2)
    const large = a1 - a0 > Math.PI ? 1 : 0
    return `M${x0},${y0} A${rOut},${rOut} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${rIn},${rIn} 0 ${large} 0 ${x3},${y3} Z`
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'center' }}>
      <svg width="300" height="300" viewBox="0 0 300 300">
        {segs.map((s, i) => (
          <g key={i}>
            <path d={arcPath(r2, r3, s.start, s.end)} fill={masteryColor(s.row.mastery)} stroke="var(--canvas)" strokeWidth="1.5" onClick={() => onSelect?.(s.row.id)} style={{ cursor: 'pointer', opacity: focusId === s.row.id ? 1 : 0.92 }} />
            <path d={arcPath(r1, r2, s.start, s.end)} fill={masteryColor(Math.max(0, s.row.mastery - 0.1))} stroke="var(--canvas)" strokeWidth="1.5" opacity={0.7} />
          </g>
        ))}
        <circle cx={cx} cy={cy} r={r1 - 4} fill="var(--panel)" stroke="var(--hair)" strokeWidth="0.5" />
        <text x={cx} y={cy - 4} textAnchor="middle" style={{ font: '500 22px var(--serif)', fill: 'var(--ink)' }}>
          {Math.round((rows.reduce((s, r) => s + r.mastery * r.items, 0) / total) * 100)}%
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" style={{ font: '500 10px var(--sans)', letterSpacing: '0.08em', textTransform: 'uppercase', fill: 'var(--ink-3)' }}>overall</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r) => (
          <div key={r.id} onClick={() => onSelect?.(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 0' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: masteryColor(r.mastery) }} />
            <span style={{ font: '500 13px var(--sans)', color: 'var(--ink-2)', flex: 1 }}>{abbrChip(r.abbr, 8)}{r.name}</span>
            <span style={{ font: '500 12px var(--mono)', color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(r.mastery * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MasteryViz({ kind, rows, onSelect, focusId }: VizProps & { kind: string }) {
  switch (kind) {
    case 'bars': return <MasteryBars rows={rows} onSelect={onSelect} focusId={focusId} />
    case 'dots': return <MasteryDots rows={rows} onSelect={onSelect} focusId={focusId} />
    case 'sunburst': return <MasterySunburst rows={rows} onSelect={onSelect} focusId={focusId} />
    default: return <MasteryHeatmap rows={rows} onSelect={onSelect} focusId={focusId} />
  }
}

export function MasteryLegend() {
  const stops = [
    { c: 'var(--m0)', l: 'Cold' }, { c: 'var(--m1)', l: 'Shaky' }, { c: 'var(--m2)', l: 'Building' },
    { c: 'var(--m3)', l: 'Solid' }, { c: 'var(--m4)', l: 'Strong' }
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 11px var(--sans)', color: 'var(--ink-3)' }}>
      <span style={{ marginRight: 2 }}>Mastery</span>
      {stops.map((s, i) => (
        <React.Fragment key={i}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: s.c }} />
          <span>{s.l}</span>
        </React.Fragment>
      ))}
    </div>
  )
}

export function LinkRail({ items, dense = false }: { items: any[]; dense?: boolean }) {
  return (
    <div className="linkrail">
      {items.map((it, i) => (
        <div key={i} className="item">
          <KindGlyph kind={it.from.kind} />
          <span className="title" style={{ flex: '0 1 auto', maxWidth: 280 }}>{it.from.label}</span>
          <span className="arrow"><Icon name="arrow-r" size={12} /></span>
          <KindGlyph kind={it.to.kind} />
          <span className="title">{it.to.label}</span>
          {!dense && (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge slate" title={`Linked via ${it.via}`}>
                <span className="d"></span>{it.via}
                {it.score && <span className="tnum" style={{ marginLeft: 4, color: 'var(--ink-3)' }}>·{it.score.toFixed(2)}</span>}
              </span>
              <span style={{ font: '500 11px var(--sans)', color: 'var(--ink-3)' }}>{it.when}</span>
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// Shown when a live read returns zero rows, or for a domain with no endpoint yet
// (⊥ silent mock). Replaces the old offline sample-data fallback.
export function EmptyState({ text, hint }: { text: string; hint?: string }) {
  return (
    <div style={{ padding: '26px 16px', textAlign: 'center' }}>
      <div style={{ font: '500 13px var(--sans)', color: 'var(--ink-2)' }}>{text}</div>
      {hint && <div style={{ font: '500 11.5px var(--sans)', color: 'var(--ink-3)', marginTop: 3 }}>{hint}</div>}
    </div>
  )
}

// No-op handler for a control whose backing action isn't wired yet. Logs a TODO
// so the wiring point is greppable; `name` identifies the action/endpoint.
export const stubAction = (name: string) => console.debug('[stub] TODO: wire', name)

// A button that is visible + clickable but inert: greyed (visual indicator) and
// wired to stubAction. Children carry the icon/label/kbd so all tb-btn variants
// (ghost/primary) are preserved via className.
export function StubButton({
  children, name, className = 'tb-btn', title, style
}: {
  children: React.ReactNode; name: string; className?: string; title?: string; style?: CSS
}) {
  return (
    <button
      className={className}
      data-stub
      title={title ?? `Not wired yet — ${name}`}
      onClick={() => stubAction(name)}
      style={{ opacity: 0.55, ...style }}
    >
      {children}
    </button>
  )
}

export function StatCard({
  label, value, sub, accent = 'ink', footer, onClick
}: {
  label: string; value: React.ReactNode; sub?: string; accent?: string
  footer?: React.ReactNode; onClick?: () => void
}) {
  const accentMap: Record<string, { c: string; b: string }> = {
    ink: { c: 'var(--ink)', b: 'rgba(40,30,15,0.06)' },
    clay: { c: 'var(--clay)', b: 'var(--clay-2)' },
    moss: { c: 'var(--moss)', b: 'var(--moss-2)' },
    amber: { c: 'var(--amber)', b: 'var(--amber-2)' },
    plum: { c: 'var(--plum)', b: 'var(--plum-2)' },
    slate: { c: 'var(--slate)', b: 'var(--slate-2)' }
  }
  const a = accentMap[accent] || accentMap.ink
  return (
    <div onClick={onClick} className="card" style={{ padding: '14px 16px 13px', cursor: onClick ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 116 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.c, flexShrink: 0 }} />
        <span style={{ font: '500 11px var(--sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ font: '500 32px var(--serif)', color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{value}</span>
        {sub && <span style={{ font: '500 12px var(--sans)', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{sub}</span>}
      </div>
      <div style={{ flex: 1 }} />
      {footer}
    </div>
  )
}
