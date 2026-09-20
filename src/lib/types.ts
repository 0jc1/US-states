/** year (as string key) -> numeric value */
export type YearSeries = Record<string, number>

export type EntityLevel = 'state' | 'city'

export const AGE_BUCKETS = ['0-17', '18-34', '35-54', '55-64', '65+'] as const
export type AgeBucket = (typeof AGE_BUCKETS)[number]
/** shares that sum to ~1 */
export type AgeBuckets = Record<AgeBucket, number>

export const DEMO_GROUPS = [
  'white',
  'hispanic',
  'black',
  'asian',
  'native',
  'pacific',
  'multi',
] as const
export type DemoGroup = (typeof DEMO_GROUPS)[number]
/** shares that sum to ~1 */
export type DemographicShares = Record<DemoGroup, number>

export interface Industry {
  sector: string
  /** share of total GDP, 0..1 */
  share: number
  /** GDP in millions of current dollars */
  gdp: number
}

export interface EntityStats {
  population?: YearSeries
  medianAge?: YearSeries
  ageDistribution?: Record<string, AgeBuckets>
  demographics?: Record<string, DemographicShares>
  /** probability two random residents belong to different groups, 0..1 */
  diversityIndex?: YearSeries
  /** BEA regional price parity, all items, US = 100 */
  costOfLiving?: YearSeries
  /** BEA regional price parity, rents, US = 100 */
  rentIndex?: YearSeries
  /** typical home value in dollars (Zillow ZHVI, annual average) */
  homeValue?: YearSeries
  /** nonfarm employment, thousands */
  employment?: YearSeries
  /** YoY % change in nonfarm employment */
  jobGrowth?: YearSeries
  /** % */
  unemploymentRate?: YearSeries
  /** offenses per 100k */
  violentCrime?: YearSeries
  propertyCrime?: YearSeries
  crimeRate?: YearSeries
  /** current dollars */
  gdpPerCapita?: YearSeries
  /** current dollars */
  totalGdp?: YearSeries
  industries?: Record<string, Industry[]>
}

export interface EntityBase {
  id: string
  name: string
  level: EntityLevel
  stats: EntityStats
  /** statId -> list of years whose value is a partial-year (YTD) figure */
  partial?: Record<string, number[]>
}

export interface StateEntity extends EntityBase {
  level: 'state'
  /** two-letter postal code, same as id */
  abbr: string
  fips: string
}

export interface CityEntity extends EntityBase {
  level: 'city'
  state: string
  lat: number
  lng: number
  /** metro area used for metro-level stats (GDP, RPP, unemployment) */
  metro?: string
}

export type Entity = StateEntity | CityEntity

export interface SourceInfo {
  statId: string
  dataset: string
  publisher: string
  url: string
  vintage: string
  years: string
  notes?: string
}
