import { fetchText } from '../lib/http.ts'
import { parseStateName } from '../lib/states.ts'
import type { StateEntity, YearSeries } from '../../src/lib/types.ts'

function stripTags(s: string) {
  return s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\[.*?\]/g, '').replace(/,/g, '').replace(/\s+/g, ' ').trim()
}

function parseNumber(s: string): number | undefined {
  const n = Number(stripTags(s).replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : undefined
}

/** Parse the first wikitable into rows of cell text. */
function wikiTables(html: string): string[][][] {
  const tables: string[][][] = []
  const re = /<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const body = m[1]
    const rows: string[][] = []
    const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    let tr: RegExpExecArray | null
    while ((tr = trRe.exec(body))) {
      const cells: string[] = []
      const tdRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi
      let td: RegExpExecArray | null
      while ((td = tdRe.exec(tr[1]))) cells.push(td[1])
      if (cells.length) rows.push(cells)
    }
    if (rows.length > 2) tables.push(rows)
  }
  return tables
}

export async function applyCensusWiki(states: Record<string, StateEntity>): Promise<string> {
  const html = await fetchText(
    'https://en.wikipedia.org/wiki/List_of_U.S._states_and_territories_by_population',
    'wiki-state-pop.html',
  )
  const tables = wikiTables(html)
  const table = tables[0]
  if (!table) throw new Error('no wikipedia population table')
  let applied = 0
  for (const row of table.slice(1)) {
    const nameCell = row.find((c) => /wiki\/(Alabama|Alaska|Arizona|California|Texas|Florida)/.test(c) || parseStateName(stripTags(c)))
    if (!nameCell) continue
    const meta = parseStateName(stripTags(nameCell.replace(/<a[^>]*>/, '').replace(/<\/a>/, ''))) ?? parseStateName(stripTags(nameCell))
    if (!meta || !states[meta.abbr]) continue
    const nums = row.map(parseNumber).filter((n): n is number => n !== undefined && n > 50_000 && n < 50_000_000)
    // Typical columns: 2025 estimate, 2020 census, ...
    const est2025 = nums[0]
    const census2020 = nums.find((n) => n !== est2025 && n > 50_000)
    if (!est2025) continue
    const pop: YearSeries = { ...states[meta.abbr].stats.population }
    pop['2025'] = Math.round(est2025)
    if (census2020) pop['2020'] = Math.round(census2020)
    if (pop['2024'] && pop['2025']) {
      const g = (pop['2025'] - pop['2024']) / pop['2024']
      pop['2026'] = Math.round(pop['2025'] * (1 + g))
    }
    states[meta.abbr].stats.population = pop
    applied++
  }
  return `wikipedia population: ${applied} states`
}
