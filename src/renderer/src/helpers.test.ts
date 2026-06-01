import { describe, it, expect } from 'vitest'
import { masteryColor, masteryLabel, buildNodeIndex, makeNodePath } from './helpers'
import type { OutlineNodeT } from './types'

// Pure helpers — the 5-stop mastery scale + outline index/path builders.
// Thresholds must match the design prototype exactly; off-by-one at a band
// edge silently mis-colors the whole outline.

const node = (id: number, parent: number | null, name: string): OutlineNodeT => ({
  id, parent, depth: 0, kind: 'topic', name, mastery: 0, items: 1
})

describe('masteryColor — 5-stop bands', () => {
  it('null / undefined → m0 (no measured mastery, ⊥ a fabricated value)', () => {
    expect(masteryColor(null)).toBe('var(--m0)')
    expect(masteryColor(undefined)).toBe('var(--m0)')
  })

  it('maps each band to its CSS var', () => {
    expect(masteryColor(0)).toBe('var(--m0)')
    expect(masteryColor(0.24)).toBe('var(--m0)')
    expect(masteryColor(0.25)).toBe('var(--m1)')
    expect(masteryColor(0.44)).toBe('var(--m1)')
    expect(masteryColor(0.45)).toBe('var(--m2)')
    expect(masteryColor(0.61)).toBe('var(--m2)')
    expect(masteryColor(0.62)).toBe('var(--m3)')
    expect(masteryColor(0.77)).toBe('var(--m3)')
    expect(masteryColor(0.78)).toBe('var(--m4)')
    expect(masteryColor(1)).toBe('var(--m4)')
  })
})

describe('masteryLabel — band text', () => {
  it('null / undefined → em dash', () => {
    expect(masteryLabel(null)).toBe('—')
    expect(masteryLabel(undefined)).toBe('—')
  })

  it('maps each band to its label', () => {
    expect(masteryLabel(0)).toBe('Cold')
    expect(masteryLabel(0.24)).toBe('Cold')
    expect(masteryLabel(0.25)).toBe('Shaky')
    expect(masteryLabel(0.45)).toBe('Building')
    expect(masteryLabel(0.62)).toBe('Solid')
    expect(masteryLabel(0.78)).toBe('Strong')
    expect(masteryLabel(1)).toBe('Strong')
  })

  it('color and label agree at every band edge', () => {
    const pairs: [number, string, string][] = [
      [0.2, 'var(--m0)', 'Cold'],
      [0.3, 'var(--m1)', 'Shaky'],
      [0.5, 'var(--m2)', 'Building'],
      [0.7, 'var(--m3)', 'Solid'],
      [0.9, 'var(--m4)', 'Strong']
    ]
    for (const [m, c, l] of pairs) {
      expect(masteryColor(m)).toBe(c)
      expect(masteryLabel(m)).toBe(l)
    }
  })
})

describe('buildNodeIndex', () => {
  it('keys nodes by id', () => {
    const idx = buildNodeIndex([node(1, null, 'A'), node(2, 1, 'B')])
    expect(Object.keys(idx)).toEqual(['1', '2'])
    expect(idx[2].name).toBe('B')
  })

  it('empty outline → empty index', () => {
    expect(buildNodeIndex([])).toEqual({})
  })

  it('last node wins on duplicate id', () => {
    const idx = buildNodeIndex([node(1, null, 'first'), node(1, null, 'second')])
    expect(idx[1].name).toBe('second')
  })
})

describe('makeNodePath — leaf→root walk, breadcrumb order', () => {
  const outline = [
    node(1, null, 'Section'),
    node(2, 1, 'Topic'),
    node(3, 2, 'Subtopic')
  ]
  const path = makeNodePath(buildNodeIndex(outline))

  it('returns ancestors root-first', () => {
    expect(path(3)).toEqual(['Section', 'Topic', 'Subtopic'])
  })

  it('root node → single-element path', () => {
    expect(path(1)).toEqual(['Section'])
  })

  it('unknown id → empty path (⊥ throw)', () => {
    expect(path(999)).toEqual([])
  })

  it('stops at a missing parent rather than looping', () => {
    // node 2's parent (1) is absent from the index → walk stops cleanly.
    const orphan = makeNodePath(buildNodeIndex([node(2, 1, 'Topic')]))
    expect(orphan(2)).toEqual(['Topic'])
  })
})
