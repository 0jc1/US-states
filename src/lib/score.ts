import { YEARS } from './stats'
import type { CityEntity, Entity, EntityStats, StateEntity, YearSeries } from './types'

export const PILLAR_WEIGHTS = {
  prosperity: 0.25,
  opportunity: 0.2,
  affordability: 0.25,
  safety: 0.2,
  momentum: 0.1,
} as const

export type PillarId = keyof typeof PILLAR_WEIGHTS

export const PILLAR_DEFS: { id: PillarId; label: string; detail: string }[] = [
  { id: 'prosperity', label: 'Prosperity', detail: 'Price-adjusted GDP per capita' },
  { id: 'opportunity', label: 'Opportunity', detail: 'Unemployment and job growth' },
  { id: 'affordability', label: 'Affordability', detail: 'Price parity and home value vs income' },
  { id: 'safety', label: 'Safety', detail: 'Violent + property crime rate' },
  { id: 'momentum', label: 'Momentum', detail: 'Population change since 2019 and job growth' },
]

export interface PillarScores {
  prosperity?: number
  opportunity?: number
  affordability?: number
  safety?: number
  momentum?: number
}

export interface EntityScore {
  id: string
  score: number
  pillars: PillarScores
}

function seriesVal(stats: EntityStats, key: keyof EntityStats, year: number): number | undefined {
  const s = stats[key]
  if (!s || typeof s !== 'object' || Array.isArray(s)) return undefined
  const v = (s as YearSeries)[String(year)]
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function realGdp(stats: EntityStats, year: number): number | undefined {
  const gdp = seriesVal(stats, 'gdpPerCapita', year)
  const rpp = seriesVal(stats, 'costOfLiving', year)
  if (gdp === undefined) return undefined
  if (rpp === undefined || rpp === 0) return gdp
  return gdp / (rpp / 100)
}

function housingYears(stats: EntityStats, year: number): number | undefined {
  const home = seriesVal(stats, 'homeValue', year)
  const gdp = seriesVal(stats, 'gdpPerCapita', year)
  if (home === undefined || gdp === undefined || gdp === 0) return undefined
  return home / gdp
}

function popGrowth(stats: EntityStats, year: number): number | undefined {
  const now = seriesVal(stats, 'population', year)
  const then = seriesVal(stats, 'population', 2019)
  if (now === undefined || then === undefined || then === 0) return undefined
  return ((now - then) / then) * 100
}

/** Average-rank percentile 0..100. Ties share a rank. Undefined stays undefined. */
export function percentileRanks(values: (number | undefined)[]): (number | undefined)[] {
  const indexed = values
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v !== undefined)
  indexed.sort((a, b) => a.v - b.v)
  const out: (number | undefined)[] = values.map(() => undefined)
  if (!indexed.length) return out
  if (indexed.length === 1) {
    out[indexed[0].i] = 50
    return out
  }
  let i = 0
  while (i < indexed.length) {
    let j = i
    while (j + 1 < indexed.length && indexed[j + 1].v === indexed[i].v) j++
    const avg = (i + j) / 2
    const pct = (avg / (indexed.length - 1)) * 100
    for (let k = i; k <= j; k++) out[indexed[k].i] = pct
    i = j + 1
  }
  return out
}

function invert(p: number | undefined): number | undefined {
  return p === undefined ? undefined : 100 - p
}

function meanDefined(xs: (number | undefined)[]): number | undefined {
  const v = xs.filter((x): x is number => x !== undefined)
  if (!v.length) return undefined
  return v.reduce((a, b) => a + b, 0) / v.length
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function scoreEntities(entities: Entity[], year: number): EntityScore[] {
  const real = entities.map((e) => realGdp(e.stats, year))
  const gdp = entities.map((e) => seriesVal(e.stats, 'gdpPerCapita', year))
  const unemp = entities.map((e) => seriesVal(e.stats, 'unemploymentRate', year))
  const jobs = entities.map((e) => seriesVal(e.stats, 'jobGrowth', year))
  const rpp = entities.map((e) => seriesVal(e.stats, 'costOfLiving', year))
  const hy = entities.map((e) => housingYears(e.stats, year))
  const crime = entities.map((e) => seriesVal(e.stats, 'crimeRate', year))
  const pg = entities.map((e) => popGrowth(e.stats, year))

  const pReal = percentileRanks(real)
  const pGdp = percentileRanks(gdp)
  const pUnemp = percentileRanks(unemp).map(invert)
  const pJobs = percentileRanks(jobs)
  const pRpp = percentileRanks(rpp).map(invert)
  const pHy = percentileRanks(hy).map(invert)
  const pCrime = percentileRanks(crime).map(invert)
  const pPg = percentileRanks(pg)

  return entities.map((e, i) => {
    const prosperity = meanDefined([pReal[i] ?? pGdp[i]])
    const opportunity = meanDefined([pUnemp[i], pJobs[i]])
    const affordability = meanDefined([pRpp[i], pHy[i]])
    const safety = pCrime[i]
    const momentum = meanDefined([pPg[i], pJobs[i]])

    const pieces: { w: number; v: number }[] = []
    if (prosperity !== undefined) pieces.push({ w: PILLAR_WEIGHTS.prosperity, v: prosperity })
    if (opportunity !== undefined) pieces.push({ w: PILLAR_WEIGHTS.opportunity, v: opportunity })
    if (affordability !== undefined) pieces.push({ w: PILLAR_WEIGHTS.affordability, v: affordability })
    if (safety !== undefined) pieces.push({ w: PILLAR_WEIGHTS.safety, v: safety })
    if (momentum !== undefined) pieces.push({ w: PILLAR_WEIGHTS.momentum, v: momentum })
    const wsum = pieces.reduce((a, p) => a + p.w, 0)
    const score = wsum === 0 ? 0 : pieces.reduce((a, p) => a + p.w * p.v, 0) / wsum

    return {
      id: e.id,
      score: round1(score),
      pillars: {
        prosperity: prosperity === undefined ? undefined : round1(prosperity),
        opportunity: opportunity === undefined ? undefined : round1(opportunity),
        affordability: affordability === undefined ? undefined : round1(affordability),
        safety: safety === undefined ? undefined : round1(safety),
        momentum: momentum === undefined ? undefined : round1(momentum),
      },
    }
  })
}

function writeScores(entities: Entity[]) {
  for (const year of YEARS) {
    const scored = scoreEntities(entities, year)
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i]
      e.stats.livabilityScore ??= {}
      e.stats.livabilityScore[String(year)] = scored[i].score
    }
  }
}

/** Peer-relative percentile composite, scored separately for states and cities. */
export function attachLivabilityScores(states: StateEntity[], cities: CityEntity[]) {
  writeScores(states)
  writeScores(cities)
}

export function pillarsFor(entities: Entity[], entity: Entity, year: number): PillarScores | undefined {
  return scoreEntities(entities, year).find((s) => s.id === entity.id)?.pillars
}
