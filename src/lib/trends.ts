import { quantile } from 'd3-array'
import type { StatDef } from './stats'
import { getValue } from './stats'
import type { Entity } from './types'

export interface Trend {
  /** signed percent change vs prior year, e.g. 2.3 for +2.3% */
  pct: number
  from: number
  to: number
  fromYear: number
  toYear: number
}

/** YoY change for one entity, comparing `year` with `year - 1`. */
export function yoy(entity: Entity, def: StatDef, year: number): Trend | undefined {
  const to = getValue(entity.stats, def, year)
  const from = getValue(entity.stats, def, year - 1)
  if (to === undefined || from === undefined || from === 0) return undefined
  return {
    pct: ((to - from) / Math.abs(from)) * 100,
    from,
    to,
    fromYear: year - 1,
    toYear: year,
  }
}

/**
 * Fire threshold: the YoY change must be in the top 10% among all entities of
 * the same level for this stat and year, in the favorable direction.
 * For `neutral` stats the magnitude of change is used.
 */
export interface FireThreshold {
  /** compare `score(trend) >= cutoff` */
  cutoff: number
  count: number
}

export function trendScore(def: StatDef, pct: number): number {
  switch (def.direction) {
    case 'higherIsBetter':
      return pct
    case 'lowerIsBetter':
      return -pct
    case 'neutral':
      return Math.abs(pct)
  }
}

const thresholdCache = new Map<string, FireThreshold | undefined>()

export function fireThreshold(entities: Entity[], def: StatDef, year: number): FireThreshold | undefined {
  const key = `${entities[0]?.level ?? 'x'}:${entities.length}:${def.id}:${year}`
  if (thresholdCache.has(key)) return thresholdCache.get(key)
  const scores: number[] = []
  for (const e of entities) {
    const t = yoy(e, def, year)
    if (t) scores.push(trendScore(def, t.pct))
  }
  let result: FireThreshold | undefined
  if (scores.length >= 5) {
    scores.sort((a, b) => a - b)
    const cutoff = quantile(scores, 0.9)
    // only "hot" if the change is actually favorable / non-trivial
    if (cutoff !== undefined && cutoff > 0) result = { cutoff, count: scores.length }
  }
  thresholdCache.set(key, result)
  return result
}

export function isFire(def: StatDef, trend: Trend | undefined, threshold: FireThreshold | undefined): boolean {
  if (!trend || !threshold) return false
  return trendScore(def, trend.pct) >= threshold.cutoff
}

/** Convenience: trend + fire flag for one entity within a peer group. */
export function trendWithFire(entities: Entity[], entity: Entity, def: StatDef, year: number) {
  const trend = yoy(entity, def, year)
  const threshold = fireThreshold(entities, def, year)
  return { trend, fire: isFire(def, trend, threshold) }
}

/** Is a positive change good, bad, or neither for coloring the percentage? */
export function trendTone(def: StatDef, pct: number): 'good' | 'bad' | 'neutral' {
  if (def.direction === 'neutral' || Math.abs(pct) < 0.05) return 'neutral'
  const favorable = def.direction === 'higherIsBetter' ? pct > 0 : pct < 0
  return favorable ? 'good' : 'bad'
}
