import type { EntityLevel, EntityStats, YearSeries } from './types'

export type StatDirection = 'higherIsBetter' | 'lowerIsBetter' | 'neutral'
export type StatFormat = 'int' | 'compact' | 'usd' | 'usdCompact' | 'pct' | 'index' | 'per100k' | 'years'
export type StatGroup = 'Score' | 'People' | 'Economy' | 'Cost' | 'Safety'

export interface StatDef {
  id: StatId
  label: string
  shortLabel: string
  group: StatGroup
  unit: string
  format: StatFormat
  direction: StatDirection
  levels: EntityLevel[]
  /** which YearSeries key in EntityStats drives the heatmap and trends */
  seriesKey: keyof EntityStats
  description: string
  /** sequential palette used in "value" mode */
  palette: 'reds' | 'blues' | 'greens' | 'purples' | 'oranges' | 'teal'
}

export type StatId =
  | 'livability'
  | 'population'
  | 'demographics'
  | 'ageDistribution'
  | 'costOfLiving'
  | 'costOfHousing'
  | 'jobGrowth'
  | 'unemploymentRate'
  | 'crimeRate'
  | 'gdpPerCapita'
  | 'totalGdp'

export const STAT_DEFS: StatDef[] = [
  {
    id: 'livability',
    label: 'Livability score',
    shortLabel: 'Livability',
    group: 'Score',
    unit: '0–100',
    format: 'index',
    direction: 'higherIsBetter',
    levels: ['state', 'city'],
    seriesKey: 'livabilityScore',
    description:
      'Peer-relative move score: prosperity, jobs, affordability, safety, and recent growth. Percentile ranks within states or cities, then weighted. Not a prestige ranking — expensive coastal output scores lower when housing and crime offset it.',
    palette: 'greens',
  },
  {
    id: 'population',
    label: 'Population',
    shortLabel: 'Population',
    group: 'People',
    unit: 'people',
    format: 'compact',
    direction: 'higherIsBetter',
    levels: ['state', 'city'],
    seriesKey: 'population',
    description: 'Resident population (Census Bureau estimates, July 1 of each year).',
    palette: 'reds',
  },
  {
    id: 'demographics',
    label: 'Demographics (diversity index)',
    shortLabel: 'Diversity',
    group: 'People',
    unit: 'index',
    format: 'pct',
    direction: 'neutral',
    levels: ['state', 'city'],
    seriesKey: 'diversityIndex',
    description:
      'Chance that two randomly chosen residents belong to different race/ethnicity groups. Full breakdown in the detail panel.',
    palette: 'purples',
  },
  {
    id: 'ageDistribution',
    label: 'Age distribution (median age)',
    shortLabel: 'Median age',
    group: 'People',
    unit: 'years',
    format: 'years',
    direction: 'neutral',
    levels: ['state', 'city'],
    seriesKey: 'medianAge',
    description: 'Median age of residents. Age buckets shown in the detail panel.',
    palette: 'teal',
  },
  {
    id: 'costOfLiving',
    label: 'Cost of living (price parity)',
    shortLabel: 'Cost of living',
    group: 'Cost',
    unit: 'US = 100',
    format: 'index',
    direction: 'lowerIsBetter',
    levels: ['state', 'city'],
    seriesKey: 'costOfLiving',
    description: 'BEA Regional Price Parity for all items. 110 means prices are 10% above the national average.',
    palette: 'oranges',
  },
  {
    id: 'costOfHousing',
    label: 'Cost of housing (typical home value)',
    shortLabel: 'Home value',
    group: 'Cost',
    unit: 'USD',
    format: 'usdCompact',
    direction: 'lowerIsBetter',
    levels: ['state', 'city'],
    seriesKey: 'homeValue',
    description: 'Typical home value (Zillow ZHVI, annual average of monthly values).',
    palette: 'oranges',
  },
  {
    id: 'jobGrowth',
    label: 'Job growth (YoY employment)',
    shortLabel: 'Job growth',
    group: 'Economy',
    unit: '%',
    format: 'pct',
    direction: 'higherIsBetter',
    levels: ['state', 'city'],
    seriesKey: 'jobGrowth',
    description: 'Year-over-year percent change in total nonfarm employment (BLS CES).',
    palette: 'greens',
  },
  {
    id: 'unemploymentRate',
    label: 'Unemployment rate',
    shortLabel: 'Unemployment',
    group: 'Economy',
    unit: '%',
    format: 'pct',
    direction: 'lowerIsBetter',
    levels: ['state', 'city'],
    seriesKey: 'unemploymentRate',
    description: 'Annual average unemployment rate (BLS LAUS).',
    palette: 'reds',
  },
  {
    id: 'crimeRate',
    label: 'Crime rate (violent + property)',
    shortLabel: 'Crime rate',
    group: 'Safety',
    unit: 'per 100k',
    format: 'per100k',
    direction: 'lowerIsBetter',
    levels: ['state', 'city'],
    seriesKey: 'crimeRate',
    description: 'Violent plus property offenses per 100,000 residents (FBI Crime Data Explorer).',
    palette: 'reds',
  },
  {
    id: 'gdpPerCapita',
    label: 'GDP per capita',
    shortLabel: 'GDP / capita',
    group: 'Economy',
    unit: 'USD',
    format: 'usd',
    direction: 'higherIsBetter',
    levels: ['state', 'city'],
    seriesKey: 'gdpPerCapita',
    description: 'Current-dollar GDP divided by resident population (BEA).',
    palette: 'blues',
  },
  {
    id: 'totalGdp',
    label: 'Total GDP (state)',
    shortLabel: 'Total GDP',
    group: 'Economy',
    unit: 'USD',
    format: 'usdCompact',
    direction: 'higherIsBetter',
    levels: ['state'],
    seriesKey: 'totalGdp',
    description: 'Total current-dollar GDP (BEA SAGDP). Not available for cities.',
    palette: 'blues',
  },
]

export const STAT_BY_ID: Record<StatId, StatDef> = Object.fromEntries(
  STAT_DEFS.map((s) => [s.id, s]),
) as Record<StatId, StatDef>

export const STAT_GROUPS: StatGroup[] = ['Score', 'People', 'Economy', 'Cost', 'Safety']

export const DEFAULT_STAT: StatId = 'livability'

export const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026] as const
export const MIN_YEAR = YEARS[0]
export const MAX_YEAR = YEARS[YEARS.length - 1]
export const DEFAULT_YEAR = 2025

export function getSeries(stats: EntityStats, def: StatDef): YearSeries | undefined {
  const s = stats[def.seriesKey]
  if (!s) return undefined
  // seriesKey always points at a YearSeries for heatmappable stats
  return s as YearSeries
}

export function getValue(stats: EntityStats, def: StatDef, year: number): number | undefined {
  const series = getSeries(stats, def)
  const v = series?.[String(year)]
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

/** most recent year <= `year` that has data, or undefined */
export function latestYearWithData(stats: EntityStats, def: StatDef, year: number): number | undefined {
  const series = getSeries(stats, def)
  if (!series) return undefined
  for (let y = year; y >= MIN_YEAR; y--) {
    if (typeof series[String(y)] === 'number') return y
  }
  return undefined
}
