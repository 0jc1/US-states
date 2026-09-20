import { fetchText } from '../lib/http.ts'
import type { CityEntity } from '../../src/lib/types.ts'
import { CITY_SEEDS } from '../seed/cities.ts'

function stripTags(s: string) {
  return s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\[.*?\]/g, '').replace(/,/g, '').replace(/\s+/g, ' ').trim()
}

export async function applyCityWiki(cities: CityEntity[]): Promise<string> {
  const html = await fetchText(
    'https://en.wikipedia.org/wiki/List_of_United_States_cities_by_population',
    'wiki-city-pop.html',
  )
  const byName = new Map(cities.map((c) => [`${c.name.toLowerCase()}|${c.state}`, c]))
  const re = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let applied = 0
  let tr: RegExpExecArray | null
  while ((tr = re.exec(html))) {
    const cells: string[] = []
    const tdRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi
    let td: RegExpExecArray | null
    while ((td = tdRe.exec(tr[1]))) cells.push(td[1])
    if (cells.length < 4) continue
    const name = stripTags(cells[1] ?? cells[0])
    const st = stripTags(cells[2] ?? '').slice(0, 2).toUpperCase()
    const city = byName.get(`${name.toLowerCase()}|${st}`)
    if (!city) continue
    const nums = cells
      .map((c) => Number(stripTags(c).replace(/[^0-9.]/g, '')))
      .filter((n) => n > 50_000 && n < 20_000_000)
    if (nums[0]) {
      city.stats.population = { ...city.stats.population, '2025': Math.round(nums[0]) }
      applied++
    }
  }
  void CITY_SEEDS
  return `wikipedia city population: ${applied}`
}
