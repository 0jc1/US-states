import { execFileSync } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { csvObjects } from '../lib/csv.ts'
import { fetchBinary } from '../lib/http.ts'
import { STATE_BY_NAME } from '../lib/states.ts'
import type { Industry, StateEntity, YearSeries } from '../../src/lib/types.ts'

function unzip(zipPath: string, dest: string) {
  execFileSync('unzip', ['-o', '-q', zipPath, '-d', dest])
}

export async function applyBea(states: Record<string, StateEntity>): Promise<string> {
  const notes: string[] = []
  try {
    const zip = await fetchBinary('https://apps.bea.gov/regional/zip/SAGDP.zip', 'SAGDP.zip')
    const dest = path.join(path.dirname(zip), 'sagdp')
    unzip(zip, dest)
    const files = await readdir(dest)
    const gdpFile = files.find((f) => /^SAGDP1N/i.test(f) && f.endsWith('.csv'))
    const indFile = files.find((f) => /^SAGDP2N/i.test(f) && f.endsWith('.csv'))
    if (gdpFile) {
      const rows = csvObjects(await readFile(path.join(dest, gdpFile), 'utf8'))
      let n = 0
      for (const row of rows) {
        const desc = (row.Description ?? row.LineCode ?? '').toLowerCase()
        const geo = (row.GeoName ?? '').replace(/ \*$/, '').trim()
        if (!desc.includes('current-dollar gdp') && row.LineCode !== '1' && !/^all industry total$/i.test(row.Description ?? '')) {
          if (row.LineCode !== '1') continue
        }
        const meta = STATE_BY_NAME[geo.toLowerCase()]
        if (!meta || !states[meta.abbr]) continue
        if ((row.Unit ?? '').toLowerCase().includes('quantity')) continue
        const totalGdp: YearSeries = { ...states[meta.abbr].stats.totalGdp }
        const gdpPerCapita: YearSeries = { ...states[meta.abbr].stats.gdpPerCapita }
        for (const y of [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]) {
          const raw = row[String(y)]
          const millions = Number(raw)
          if (!Number.isFinite(millions) || millions <= 0) continue
          const dollars = millions * 1_000_000
          totalGdp[String(y)] = dollars
          const pop = states[meta.abbr].stats.population?.[String(y)]
          if (pop) gdpPerCapita[String(y)] = Math.round(dollars / pop)
        }
        if ((row.Description ?? '').toLowerCase().includes('all industry') || row.LineCode === '1') {
          states[meta.abbr].stats.totalGdp = totalGdp
          states[meta.abbr].stats.gdpPerCapita = gdpPerCapita
          n++
        }
      }
      notes.push(`BEA SAGDP GDP: ${n} states`)
    }
    if (indFile) {
      const rows = csvObjects(await readFile(path.join(dest, indFile), 'utf8'))
      const byState: Record<string, { year: number; sector: string; gdp: number }[]> = {}
      for (const row of rows) {
        const geo = (row.GeoName ?? '').replace(/ \*$/, '').trim()
        const meta = STATE_BY_NAME[geo.toLowerCase()]
        if (!meta) continue
        const desc = (row.Description ?? '').replace(/\s+/g, ' ').trim()
        if (!desc || /^all industry/i.test(desc) || row.LineCode === '1') continue
        if (/^  /.test(row.Description ?? '') === false && Number(row.LineCode) > 3) {
          // keep major NAICS lines (not deeply nested)
        }
        const year = 2024
        const millions = Number(row[String(year)] ?? row['2025'] ?? row['2023'])
        if (!Number.isFinite(millions) || millions <= 0) continue
        byState[meta.abbr] ??= []
        byState[meta.abbr].push({ year, sector: desc.replace(/^\s+/, ''), gdp: millions })
      }
      for (const [abbr, items] of Object.entries(byState)) {
        const total = items.find((i) => /all industry/i.test(i.sector))
        const majors = items
          .filter((i) => !/all industry/i.test(i.sector))
          .sort((a, b) => b.gdp - a.gdp)
          .slice(0, 5)
        const denom = total?.gdp ?? majors.reduce((s, i) => s + i.gdp, 0)
        const industries: Industry[] = majors.map((i) => ({
          sector: i.sector,
          share: denom ? i.gdp / denom : 0,
          gdp: i.gdp,
        }))
        states[abbr].stats.industries = {
          ...states[abbr].stats.industries,
          '2024': industries,
          '2025': industries,
        }
      }
      notes.push('BEA SAGDP2 industries applied')
    }
  } catch (err) {
    notes.push(`BEA SAGDP skipped: ${(err as Error).message}`)
  }

  try {
    const zip = await fetchBinary('https://apps.bea.gov/regional/zip/SARPP.zip', 'SARPP.zip')
    const dest = path.join(path.dirname(zip), 'sarpp')
    unzip(zip, dest)
    const files = await readdir(dest)
    const csv = files.find((f) => /SARPP/i.test(f) && f.endsWith('.csv'))
    if (csv) {
      const rows = csvObjects(await readFile(path.join(dest, csv), 'utf8'))
      let n = 0
      for (const row of rows) {
        const geo = (row.GeoName ?? '').replace(/ \*$/, '').trim()
        const meta = STATE_BY_NAME[geo.toLowerCase()]
        if (!meta || !states[meta.abbr]) continue
        const desc = (row.Description ?? '').toLowerCase()
        const series: YearSeries = {}
        for (const y of [2019, 2020, 2021, 2022, 2023, 2024, 2025]) {
          const v = Number(row[String(y)])
          if (Number.isFinite(v) && v > 50) series[String(y)] = v
        }
        if (!Object.keys(series).length) continue
        if (desc.includes('all items') || desc.includes('rpp') && !desc.includes('rent')) {
          states[meta.abbr].stats.costOfLiving = { ...states[meta.abbr].stats.costOfLiving, ...series }
          n++
        }
        if (desc.includes('rent')) {
          states[meta.abbr].stats.rentIndex = { ...states[meta.abbr].stats.rentIndex, ...series }
        }
      }
      notes.push(`BEA RPP: ${n} rows`)
    }
  } catch (err) {
    notes.push(`BEA SARPP skipped: ${(err as Error).message}`)
  }

  return notes.join('; ')
}
