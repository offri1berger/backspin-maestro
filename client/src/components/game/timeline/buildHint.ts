import type { TimelineEntry } from '@backspin-maestro/shared'

/**
 * Builds a hint for where to place a timeline entry based on its position.
 * @param timeline The timeline entries.
 * @param pos The position of the entry for which to build a hint.
 * @returns The hint string.
 */
export const buildHint = (timeline: TimelineEntry[], pos: number): string => {
  const left = pos > 0 ? timeline[pos - 1]?.song.year : undefined
  const right = timeline[pos]?.song.year
  const fmt = (y: number) => `'${String(y).slice(2)}`
  if (left && right) return `Place between ${fmt(left)} and ${fmt(right)}`
  if (left) return `Place after ${fmt(left)}`
  if (right) return `Place before ${fmt(right)}`
  return 'Place anywhere'
}
