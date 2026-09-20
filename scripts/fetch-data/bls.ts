import { STATE_BY_FIPS } from '../lib/states.ts'
import { fetchText } from '../lib/http.ts'
import type { StateEntity, YearSeries } from '../../src/lib/types.ts'

function parseBlsFixed(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('series_id'))
  const rows: { series: string; year: number; period: string; value: number }[] = []
  for (const line of lines) {
    const parts = line.trim().split(/\s+/)
    if (parts.length < 4) continue
    const series = parts[0]
    const year = Number(parts[1])
    const period = parts[2]
    const value = Number(parts[3])
    if (!Number.isFinite(year) || !Number.isFinite(value)) continue
    rows.push({ series, year, period, value })
  }
  return rows
}

/** LASST{fips}0000000000003 = statewide SA unemployment rate. M13 = annual avg. */
export async function applyBls(states: Record<string, StateEntity>): Promise<string> {
  const text = await fetchText(
    'https://download.bls.gov/pub/time.series/la/la.data.3.AllStatesS',
    'bls-laus-states.txt',
  )
  const rows = parseBlsFixed(text)
  const byState: Record<string, YearSeries> = {}
  const ytd: Record<string, { sum: number; n: number }> = {}
  for (const r of rows) {
    const m = /^LASST(\d{2})0000000000003$/.exec(r.series)
    if (!m) continue
    const meta = STATE_BY_FIPS[m[1]]
    if (!meta || !states[meta.abbr]) continue
    if (r.year < 2019 || r.year > 2026) continue
    if (r.period === 'M13') {
      byState[meta.abbr] ??= {}
      byState[meta.abbr][String(r.year)] = r.value
    } else if (r.year === 2026 && /^M\d{2}$/.test(r.period)) {
      ytd[meta.abbr] ??= { sum: 0, n: 0 }
      ytd[meta.abbr].sum += r.value
      ytd[meta.abbr].n++
    }
  }
  let n = 0
  for (const [abbr, series] of Object.entries(byState)) {
    const st = states[abbr]
    st.stats.unemploymentRate = { ...st.stats.unemploymentRate, ...series }
    if (ytd[abbr]?.n) {
      st.stats.unemploymentRate!['2026'] = Math.round((ytd[abbr].sum / ytd[abbr].n) * 10) / 10
      st.partial ??= {}
      const p = new Set(st.partial.unemploymentRate ?? [])
      p.add(2026)
      st.partial.unemploymentRate = [...p]
    }
    n++
  }
  return `BLS LAUS unemployment: ${n} states`
}
