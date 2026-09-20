import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { SourceInfo } from '../../src/lib/types.ts'
import { buildFallbackStates } from '../seed/fallback.ts'
import { buildFallbackCities } from '../seed/cities.ts'
import { applyCensusWiki } from './census.ts'
import { applyBls } from './bls.ts'
import { applyBea } from './bea.ts'
import { applyZillowCities, applyZillowStates } from './zillow.ts'
import { applyFbi } from './fbi.ts'
import { applyCityWiki } from './cities.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function fillForward(series: Record<string, number> | undefined) {
  if (!series) return
  let last: number | undefined
  for (const y of [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]) {
    const v = series[String(y)]
    if (typeof v === 'number') last = v
    else if (last !== undefined) series[String(y)] = last
  }
}

async function main() {
  const live = process.argv.includes('--live')
  const states = buildFallbackStates()
  const cities = buildFallbackCities()
  const notes: string[] = ['seed fallback loaded (Census/ACS/BEA/BLS/FBI/Zillow vintages)']

  if (live) {
    const jobs: Array<() => Promise<string>> = [
      () => applyCensusWiki(states),
      () => applyCityWiki(cities),
      () => applyBls(states),
      () => applyZillowStates(states).then(async (m) => `${m}; ${await applyZillowCities(cities)}`),
      () => applyBea(states),
      () => applyFbi(states).catch((err) => `FBI skipped: ${(err as Error).message}`),
    ]
    for (const job of jobs) {
      try {
        notes.push(await job())
      } catch (err) {
        notes.push(`FAILED: ${(err as Error).message}`)
        console.warn(err)
      }
    }
    for (const st of Object.values(states)) {
      fillForward(st.stats.costOfLiving)
      fillForward(st.stats.rentIndex)
      fillForward(st.stats.unemploymentRate)
      fillForward(st.stats.homeValue)
    }
  } else {
    notes.push('offline build (pass --live to download official tables)')
  }

  const sources: SourceInfo[] = [
    {
      statId: 'population',
      dataset: 'Vintage 2025 Population Estimates (NST-EST2025) + Wikipedia tables',
      publisher: 'U.S. Census Bureau',
      url: 'https://www.census.gov/data/tables/time-series/demo/popest/2020s-state-total.html',
      vintage: 'July 1, 2025 (released Jan 2026)',
      years: '2019–2026',
      notes: '2026 is a trend extrapolation when Census has not published July 1, 2026 yet.',
    },
    {
      statId: 'demographics',
      dataset: 'ACS 1-year race/ethnicity (B03002)',
      publisher: 'U.S. Census Bureau',
      url: 'https://www.census.gov/programs-surveys/acs',
      vintage: 'ACS 2023/2024 1-year',
      years: '2019–2026',
    },
    {
      statId: 'ageDistribution',
      dataset: 'ACS 1-year age (S0101) / Census estimates',
      publisher: 'U.S. Census Bureau',
      url: 'https://www.census.gov/programs-surveys/acs',
      vintage: 'ACS 2023/2024 1-year',
      years: '2019–2026',
    },
    {
      statId: 'costOfLiving',
      dataset: 'Regional Price Parities (SARPP / MARPP)',
      publisher: 'U.S. Bureau of Economic Analysis',
      url: 'https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area',
      vintage: 'BEA RPP 2023–2024',
      years: '2019–2025',
    },
    {
      statId: 'costOfHousing',
      dataset: 'Zillow Home Value Index (ZHVI), typical home, smoothed seasonally adjusted',
      publisher: 'Zillow Research',
      url: 'https://www.zillow.com/research/data/',
      vintage: 'monthly through 2026',
      years: '2019–2026',
    },
    {
      statId: 'jobGrowth',
      dataset: 'CES / QCEW-aligned nonfarm employment, YoY %',
      publisher: 'U.S. Bureau of Labor Statistics',
      url: 'https://www.bls.gov/sae/',
      vintage: 'BLS 2025 annual; 2026 YTD',
      years: '2019–2026',
    },
    {
      statId: 'unemploymentRate',
      dataset: 'Local Area Unemployment Statistics (LAUS)',
      publisher: 'U.S. Bureau of Labor Statistics',
      url: 'https://download.bls.gov/pub/time.series/la/',
      vintage: 'annual averages; 2026 YTD',
      years: '2019–2026',
    },
    {
      statId: 'crimeRate',
      dataset: 'Crime Data Explorer summarized rates',
      publisher: 'Federal Bureau of Investigation',
      url: 'https://cde.ucr.cjis.gov/',
      vintage: '2019–2025 monthly; 2026 YTD if published',
      years: '2019–2026',
    },
    {
      statId: 'gdpPerCapita',
      dataset: 'GDP by state (SAGDP) / metro (CAGDP)',
      publisher: 'U.S. Bureau of Economic Analysis',
      url: 'https://www.bea.gov/data/gdp/gdp-state',
      vintage: 'Annual 2025 (Mar 2026 release)',
      years: '2019–2025',
    },
    {
      statId: 'totalGdp',
      dataset: 'GDP by state, current dollars (SAGDP1)',
      publisher: 'U.S. Bureau of Economic Analysis',
      url: 'https://www.bea.gov/data/gdp/gdp-state',
      vintage: 'Annual 2025',
      years: '2019–2025',
    },
  ]

  const outDir = path.join(root, 'src/data')
  const geoDir = path.join(outDir, 'geo')
  await mkdir(geoDir, { recursive: true })
  await writeFile(path.join(outDir, 'states.json'), JSON.stringify(states))
  await writeFile(path.join(outDir, 'cities.json'), JSON.stringify(cities))
  await writeFile(path.join(outDir, 'sources.json'), JSON.stringify(sources, null, 2))
  await writeFile(path.join(outDir, 'build-log.json'), JSON.stringify({ builtAt: new Date().toISOString(), notes }, null, 2))
  await copyFile(path.join(root, 'node_modules/us-atlas/states-10m.json'), path.join(geoDir, 'states-10m.json'))
  console.log(notes.join('\n'))
  console.log(`wrote ${Object.keys(states).length} states, ${cities.length} cities`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
