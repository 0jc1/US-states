import { csvObjects } from '../lib/csv.ts'
import { fetchText } from '../lib/http.ts'
import { STATE_BY_NAME } from '../lib/states.ts'
import type { CityEntity, StateEntity, YearSeries } from '../../src/lib/types.ts'

function annualize(row: Record<string, string>, year: number): number | undefined {
  const vals: number[] = []
  for (const [k, v] of Object.entries(row)) {
    if (!k.startsWith(`${year}-`)) continue
    const n = Number(v)
    if (Number.isFinite(n) && n > 0) vals.push(n)
  }
  if (!vals.length) return undefined
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}

export async function applyZillowStates(states: Record<string, StateEntity>): Promise<string> {
  const text = await fetchText(
    'https://files.zillowstatic.com/research/public_csvs/zhvi/State_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv',
    'zillow-state.csv',
  )
  const rows = csvObjects(text)
  let n = 0
  for (const row of rows) {
    const name = (row.RegionName ?? row.StateName ?? '').trim()
    const meta = STATE_BY_NAME[name.toLowerCase()]
    if (!meta || !states[meta.abbr]) continue
    const series: YearSeries = { ...states[meta.abbr].stats.homeValue }
    const partial: number[] = []
    for (const y of [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]) {
      const v = annualize(row, y)
      if (v) {
        series[String(y)] = v
        if (y === 2026) partial.push(2026)
      }
    }
    states[meta.abbr].stats.homeValue = series
    if (partial.length) {
      states[meta.abbr].partial ??= {}
      states[meta.abbr].partial.homeValue = partial
    }
    n++
  }
  return `Zillow ZHVI states: ${n}`
}

export async function applyZillowCities(cities: CityEntity[]): Promise<string> {
  const text = await fetchText(
    'https://files.zillowstatic.com/research/public_csvs/zhvi/City_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv',
    'zillow-city.csv',
  )
  const rows = csvObjects(text)
  const byKey = new Map<string, Record<string, string>>()
  for (const row of rows) {
    const name = (row.RegionName ?? '').trim().toLowerCase()
    const st = (row.StateName ?? row.State ?? '').trim()
    if (name) byKey.set(`${name}|${st}`, row)
  }
  let n = 0
  for (const city of cities) {
    const row =
      byKey.get(`${city.name.toLowerCase()}|${city.state}`) ??
      [...byKey.entries()].find(([k]) => k.startsWith(`${city.name.toLowerCase()}|`))?.[1]
    if (!row) continue
    const series: YearSeries = { ...city.stats.homeValue }
    for (const y of [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]) {
      const v = annualize(row, y)
      if (v) series[String(y)] = v
    }
    city.stats.homeValue = series
    n++
  }
  return `Zillow ZHVI cities: ${n}`
}
