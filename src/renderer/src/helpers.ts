import type { OutlineNodeT } from './types'

// 5-stop mastery scale, identical thresholds to the design prototype.
export function masteryColor(m: number | null | undefined): string {
  if (m == null) return 'var(--m0)'
  if (m < 0.25) return 'var(--m0)'
  if (m < 0.45) return 'var(--m1)'
  if (m < 0.62) return 'var(--m2)'
  if (m < 0.78) return 'var(--m3)'
  return 'var(--m4)'
}

export function masteryLabel(m: number | null | undefined): string {
  if (m == null) return '—'
  if (m < 0.25) return 'Cold'
  if (m < 0.45) return 'Shaky'
  if (m < 0.62) return 'Building'
  if (m < 0.78) return 'Solid'
  return 'Strong'
}

export function buildNodeIndex(outline: OutlineNodeT[]): Record<number, OutlineNodeT> {
  return Object.fromEntries(outline.map((n) => [n.id, n]))
}

export function makeNodePath(byId: Record<number, OutlineNodeT>) {
  return (id: number): string[] => {
    const parts: string[] = []
    let n: OutlineNodeT | undefined = byId[id]
    while (n) {
      parts.unshift(n.name)
      n = n.parent != null ? byId[n.parent] : undefined
    }
    return parts
  }
}
