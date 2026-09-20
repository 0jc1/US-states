import { fetchJson, sleep } from '../lib/http.ts'
import { STATES } from '../lib/states.ts'
import type { StateEntity, YearSeries } from '../../src/lib/types.ts'

interface CdeResponse {
  offenses?: { rates?: Record<string, Record<string, number>> }
}

function annualFromMonthly(months: Record<string, number> | undefined, year: number): { value: number; n: number } | undefined {
  if (!months) return undefined
  const vals: number[] = []
  const prefix = `${String(year).slice(2)}` // unused; keys are MM-YYYY
  for (const [k, v] of Object.entries(months)) {
    // keys like "01-2024"
    if (!k.endsWith(`-${year}`) && !k.startsWith(`${year}-`)) {
      const parts = k.split('-')
      if (parts.length === 2 && Number(parts[1]) === year) {
        if (Number.isFinite(v)) vals.push(v)
      }
      continue
    }
    if (Number.isFinite(v)) vals.push(v)
  }
  // parse MM-YYYY
  if (!vals.length) {
    for (const [k, v] of Object.entries(months)) {
      const m = /^(\d{2})-(\d{4})$/.exec(k)
      if (m && Number(m[2]) === year && Number.isFinite(v)) vals.push(v)
    }
  }
  if (!vals.length) return undefined
  void prefix
  return { value: vals.reduce((a, b) => a + b, 0) / vals.length, n: vals.length }
}

export async function applyFbi(states: Record<string, StateEntity>): Promise<string> {
  let n = 0
  let rateLimited = false
  for (const meta of STATES) {
    if (!states[meta.abbr]) continue
    if (rateLimited) break
    try {
      const violent = await fetchJson<CdeResponse>(
        `https://api.usa.gov/crime/fbi/cde/summarized/state/${meta.abbr}/violent-crime?from=01-2019&to=12-2026&API_KEY=DEMO_KEY`,
        `fbi-${meta.abbr}-violent.json`,
      )
      await sleep(120)
      const property = await fetchJson<CdeResponse>(
        `https://api.usa.gov/crime/fbi/cde/summarized/state/${meta.abbr}/property-crime?from=01-2019&to=12-2026&API_KEY=DEMO_KEY`,
        `fbi-${meta.abbr}-property.json`,
      )
      const vRates = Object.values(violent.offenses?.rates ?? {})[0]
      const pRates = Object.values(property.offenses?.rates ?? {})[0]
      const violentCrime: YearSeries = { ...states[meta.abbr].stats.violentCrime }
      const propertyCrime: YearSeries = { ...states[meta.abbr].stats.propertyCrime }
      const crimeRate: YearSeries = { ...states[meta.abbr].stats.crimeRate }
      const partial: number[] = []
      for (const y of [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]) {
        const v = annualFromMonthly(vRates, y)
        const p = annualFromMonthly(pRates, y)
        if (v) {
          violentCrime[String(y)] = Math.round(v.value * 10) / 10
          if (v.n < 12) partial.push(y)
        }
        if (p) {
          propertyCrime[String(y)] = Math.round(p.value * 10) / 10
          if (p.n < 12) partial.push(y)
        }
        if (violentCrime[String(y)] !== undefined && propertyCrime[String(y)] !== undefined) {
          crimeRate[String(y)] = Math.round((violentCrime[String(y)] + propertyCrime[String(y)]) * 10) / 10
        }
      }
      states[meta.abbr].stats.violentCrime = violentCrime
      states[meta.abbr].stats.propertyCrime = propertyCrime
      states[meta.abbr].stats.crimeRate = crimeRate
      if (partial.length) {
        states[meta.abbr].partial ??= {}
        states[meta.abbr].partial.crimeRate = [...new Set(partial)]
      }
      n++
    } catch (err) {
      const msg = (err as Error).message
      console.warn(`FBI ${meta.abbr} failed:`, msg)
      if (msg.includes('429')) rateLimited = true
    }
    await sleep(80)
  }
  return `FBI CDE crime: ${n} states`
}
