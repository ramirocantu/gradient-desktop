// App shell — sidebar, course picker, toolbar. Ported from shell.jsx;
// window.COURSE → useDB(). Course picker is docked at the bottom (opens up);
// the status bar doubles as the Settings entry. Live status moved to the
// Settings page.
import React from 'react'
import { Icon } from './primitives'
import { useDB, useStore } from '../data/store'
import { cfg } from '../data/client'
import type { View } from '../views'

interface Counts { review: number; anki: number; captures: number; pdfs: number }

export function Sidebar({ view, setView, counts }: { view: View; setView: (v: View) => void; counts: Counts }) {
  const db = useDB()
  const [picker, setPicker] = React.useState(false)

  const navSections: { label: string; items: { id: View; icon: string; label: string; count?: number }[] }[] = [
    { label: 'Today', items: [
      { id: 'home', icon: 'home', label: 'Home' },
      { id: 'review', icon: 'queue', label: 'Review queue', count: counts.review },
      { id: 'session', icon: 'session', label: 'Recent sessions' }
    ] },
    { label: 'Library', items: [
      { id: 'outline', icon: 'outline', label: 'Outline browser' },
      { id: 'node', icon: 'node', label: 'Node detail' },
      { id: 'anki', icon: 'anki', label: 'Anki', count: counts.anki },
      { id: 'facts', icon: 'doc', label: 'Atomic facts' },
      { id: 'notion', icon: 'notion', label: 'Notion pages' }
    ] },
    { label: 'Ingest', items: [
      { id: 'captures', icon: 'captures', label: 'Captures', count: counts.captures },
      { id: 'pdfs', icon: 'pdf', label: 'PDFs', count: counts.pdfs }
    ] }
  ]

  return (
    <aside className="sidebar">
      <div className="traffic">
        {cfg.platform === 'darwin' ? null : (<><div className="dot r" /><div className="dot y" /><div className="dot g" /></>)}
      </div>

      <div className="scroll">
        {navSections.map((sec) => (
          <div key={sec.label}>
            <div className="nav-section-label">{sec.label}</div>
            {sec.items.map((it) => (
              <div key={it.id} className={'nav-item' + (view === it.id ? ' active' : '')} onClick={() => setView(it.id)}>
                <span className="ico"><Icon name={it.icon} /></span>
                <span>{it.label}</span>
                {it.count != null && <span className="count">{it.count}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Course picker docked at the bottom; its menu opens upward. */}
      <div className="course-dock" style={{ position: 'relative' }}>
        {picker && (
          <CoursePickerMenu close={() => setPicker(false)} onAddCourse={() => { setPicker(false); setView('onboard') }} />
        )}
        <div className="course-pill" title="Switch course" onClick={() => setPicker((p) => !p)}>
          <div className="swatch">{db.COURSE.abbr}</div>
          <div className="meta">
            <div className="name">{db.COURSE.shortName} · outline</div>
            <div className="sub">{db.COURSE.nodeCount.toLocaleString()} nodes · {db.COURSE.questionCount.toLocaleString()} Qs</div>
          </div>
          <span className="chevron" style={{ transform: picker ? 'none' : 'rotate(180deg)', transition: 'transform 0.15s' }}>⌄</span>
        </div>
      </div>

      {/* Status bar = Settings entry */}
      <div className={'footer footer-settings' + (view === 'settings' ? ' active' : '')}
           onClick={() => setView('settings')}>
        <span className="ico"><Icon name="settings" /></span>
        <span>Settings</span>
      </div>
    </aside>
  )
}

function CoursePickerMenu({ close, onAddCourse }: { close: () => void; onAddCourse: () => void }) {
  const db = useDB()
  const { status } = useStore()
  const hoverBg = (on: boolean) => (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.background = on ? 'rgba(40,30,15,0.04)' : 'transparent'
  }
  return (
    <>
      <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'transparent' }} />
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 'calc(100% + 4px)', background: 'var(--panel)', border: '0.5px solid var(--hair)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', padding: 4, zIndex: 41 }}>
        <div style={{ font: '500 10px var(--sans)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)', padding: '8px 10px 4px' }}>Courses</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 7, background: 'var(--clay-2)', cursor: 'default' }}>
          <div className="swatch" style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, var(--clay), var(--amber))', color: 'white', font: '600 11px var(--sans)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{db.COURSE.abbr}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '600 12.5px var(--sans)', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{db.COURSE.shortName} · outline</div>
            <div style={{ font: '500 11px var(--sans)', color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{db.COURSE.nodeCount.toLocaleString()} nodes · {status.online ? 'live' : 'sample'}</div>
          </div>
          <Icon name="check" size={12} color="var(--clay)" />
        </div>

        <div className="hr" style={{ margin: '4px 4px' }} />

        <div onClick={onAddCourse} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', color: 'var(--ink-2)' }} onMouseEnter={hoverBg(true)} onMouseLeave={hoverBg(false)}>
          <span style={{ width: 22, height: 22, borderRadius: 6, border: '1px dashed var(--hair)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--ink-3)' }}><Icon name="plus" size={12} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ font: '600 12.5px var(--sans)', color: 'var(--ink)' }}>Add a course</div>
            <div style={{ font: '500 11px var(--sans)', color: 'var(--ink-3)' }}>Upload an outline schema</div>
          </div>
        </div>

        <div onClick={() => close()} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', color: 'var(--ink-2)' }} onMouseEnter={hoverBg(true)} onMouseLeave={hoverBg(false)}>
          <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--sunken)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--ink-3)' }}><Icon name="settings" size={11} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ font: '600 12.5px var(--sans)', color: 'var(--ink)' }}>Manage courses</div>
            <div style={{ font: '500 11px var(--sans)', color: 'var(--ink-3)' }}>Re-upload schema · export · rename</div>
          </div>
        </div>
      </div>
    </>
  )
}

export function Toolbar({ crumbs = [], right }: { crumbs?: string[]; right?: React.ReactNode }) {
  return (
    <div className="toolbar">
      <div className="crumb">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">›</span>}
            <span className={i === crumbs.length - 1 ? 'leaf' : ''}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="spacer" />
      {right}
    </div>
  )
}
