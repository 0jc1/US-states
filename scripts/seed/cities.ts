import { readFileSync } from 'node:fs'
import type { AgeBuckets, CityEntity, DemographicShares, Industry, YearSeries } from '../../src/lib/types.ts'
import { diversityIndex, seriesFromAnchors, buildFallbackStates } from './fallback.ts'

interface CityAnchor {
  medianAge?: number
  demo?: DemographicShares
  age?: AgeBuckets
  costOfLiving?: YearSeries
  rentIndex?: YearSeries
  gdpPerCapita?: YearSeries
  unemploymentRate?: YearSeries
  employment?: YearSeries
  jobGrowth?: YearSeries
  homeValue?: YearSeries
  industries?: [string, number][]
  violent?: number
  property?: number
}

const CITY_ANCHORS: Record<string, CityAnchor> = JSON.parse(
  readFileSync(new URL('./city-anchors.json', import.meta.url), 'utf8'),
) as Record<string, CityAnchor>

export interface CitySeed {
  id: string
  name: string
  state: string
  lat: number
  lng: number
  metro: string
  /** Census place GEOID (state + place FIPS) */
  place: string
  /** OMB CBSA used by BEA metro RPP */
  cbsa: string
  /** County FIPS for BEA CAGDP (NYC is the five boroughs) */
  county: string[]
  pop2020: number
  pop2025: number
}

/** 50 largest US cities by 2025 Census city-limits estimates, with Gazetteer coordinates. */
export const CITY_SEEDS: CitySeed[] = [
  { id: 'new-york', name: 'New York', state: 'NY', lat: 40.7128, lng: -74.006, metro: 'New York-Newark-Jersey City', place: '3651000', cbsa: '35620', county: ['36005', '36047', '36061', '36081', '36085'], pop2020: 8804190, pop2025: 8478072 },
  { id: 'los-angeles', name: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437, metro: 'Los Angeles-Long Beach-Anaheim', place: '0644000', cbsa: '31080', county: ['06037'], pop2020: 3898747, pop2025: 3875322 },
  { id: 'chicago', name: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298, metro: 'Chicago-Naperville-Elgin', place: '1714000', cbsa: '16980', county: ['17031'], pop2020: 2746388, pop2025: 2665039 },
  { id: 'houston', name: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698, metro: 'Houston-Pasadena-The Woodlands', place: '4835000', cbsa: '26420', county: ['48201'], pop2020: 2304580, pop2025: 2390125 },
  { id: 'phoenix', name: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.074, metro: 'Phoenix-Mesa-Chandler', place: '0455000', cbsa: '38060', county: ['04013'], pop2020: 1608139, pop2025: 1708127 },
  { id: 'philadelphia', name: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652, metro: 'Philadelphia-Camden-Wilmington', place: '4260000', cbsa: '37980', county: ['42101'], pop2020: 1603797, pop2025: 1576251 },
  { id: 'san-antonio', name: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936, metro: 'San Antonio-New Braunfels', place: '4865000', cbsa: '41700', county: ['48029'], pop2020: 1434625, pop2025: 1514736 },
  { id: 'san-diego', name: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611, metro: 'San Diego-Chula Vista-Carlsbad', place: '0666000', cbsa: '41740', county: ['06073'], pop2020: 1386932, pop2025: 1404452 },
  { id: 'dallas', name: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.797, metro: 'Dallas-Fort Worth-Arlington', place: '4819000', cbsa: '19100', county: ['48113'], pop2020: 1304379, pop2025: 1331107 },
  { id: 'jacksonville', name: 'Jacksonville', state: 'FL', lat: 30.3322, lng: -81.6557, metro: 'Jacksonville', place: '1235000', cbsa: '27260', county: ['12031'], pop2020: 949611, pop2025: 1002151 },
  { id: 'austin', name: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431, metro: 'Austin-Round Rock-San Marcos', place: '4805000', cbsa: '12420', county: ['48453'], pop2020: 961855, pop2025: 984567 },
  { id: 'fort-worth', name: 'Fort Worth', state: 'TX', lat: 32.7555, lng: -97.3308, metro: 'Dallas-Fort Worth-Arlington', place: '4827000', cbsa: '19100', county: ['48439'], pop2020: 918915, pop2025: 996525 },
  { id: 'san-jose', name: 'San Jose', state: 'CA', lat: 37.3382, lng: -121.8863, metro: 'San Jose-Sunnyvale-Santa Clara', place: '0668000', cbsa: '41940', county: ['06085'], pop2020: 1013240, pop2025: 997368 },
  { id: 'columbus', name: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988, metro: 'Columbus', place: '3918000', cbsa: '18140', county: ['39049'], pop2020: 905748, pop2025: 933263 },
  { id: 'charlotte', name: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431, metro: 'Charlotte-Concord-Gastonia', place: '3712000', cbsa: '16740', county: ['37119'], pop2020: 874579, pop2025: 943476 },
  { id: 'indianapolis', name: 'Indianapolis', state: 'IN', lat: 39.7684, lng: -86.1581, metro: 'Indianapolis-Carmel-Greenwood', place: '1836003', cbsa: '26900', county: ['18097'], pop2020: 887642, pop2025: 891484 },
  { id: 'san-francisco', name: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194, metro: 'San Francisco-Oakland-Fremont', place: '0667000', cbsa: '41860', county: ['06075'], pop2020: 873965, pop2025: 827526 },
  { id: 'seattle', name: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321, metro: 'Seattle-Tacoma-Bellevue', place: '5363000', cbsa: '42660', county: ['53033'], pop2020: 737015, pop2025: 780995 },
  { id: 'denver', name: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903, metro: 'Denver-Aurora-Centennial', place: '0820000', cbsa: '19740', county: ['08031'], pop2020: 715522, pop2025: 729019 },
  { id: 'oklahoma-city', name: 'Oklahoma City', state: 'OK', lat: 35.4676, lng: -97.5164, metro: 'Oklahoma City', place: '4055000', cbsa: '36420', county: ['40109'], pop2020: 681054, pop2025: 712919 },
  { id: 'nashville', name: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816, metro: 'Nashville-Davidson-Murfreesboro', place: '4752006', cbsa: '34980', county: ['47037'], pop2020: 689447, pop2025: 704897 },
  { id: 'washington', name: 'Washington', state: 'DC', lat: 38.9072, lng: -77.0369, metro: 'Washington-Arlington-Alexandria', place: '1150000', cbsa: '47900', county: ['11001'], pop2020: 689545, pop2025: 711736 },
  { id: 'el-paso', name: 'El Paso', state: 'TX', lat: 31.7619, lng: -106.485, metro: 'El Paso', place: '4824000', cbsa: '21340', county: ['48141'], pop2020: 678815, pop2025: 681723 },
  { id: 'las-vegas', name: 'Las Vegas', state: 'NV', lat: 36.1699, lng: -115.1398, metro: 'Las Vegas-Henderson-Paradise', place: '3240000', cbsa: '29820', county: ['32003'], pop2020: 641903, pop2025: 678922 },
  { id: 'boston', name: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589, metro: 'Boston-Cambridge-Newton', place: '2507000', cbsa: '14460', county: ['25025'], pop2020: 675647, pop2025: 673862 },
  { id: 'detroit', name: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458, metro: 'Detroit-Warren-Dearborn', place: '2622000', cbsa: '19820', county: ['26163'], pop2020: 639111, pop2025: 645705 },
  { id: 'portland', name: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784, metro: 'Portland-Vancouver-Hillsboro', place: '4159000', cbsa: '38900', county: ['41051'], pop2020: 652503, pop2025: 635067 },
  { id: 'louisville', name: 'Louisville', state: 'KY', lat: 38.2527, lng: -85.7585, metro: 'Louisville/Jefferson County', place: '2148006', cbsa: '31140', county: ['21111'], pop2020: 633045, pop2025: 640616 },
  { id: 'memphis', name: 'Memphis', state: 'TN', lat: 35.1495, lng: -90.049, metro: 'Memphis', place: '4748000', cbsa: '32820', county: ['47157'], pop2020: 633104, pop2025: 610861 },
  { id: 'baltimore', name: 'Baltimore', state: 'MD', lat: 39.2904, lng: -76.6122, metro: 'Baltimore-Columbia-Towson', place: '2404000', cbsa: '12580', county: ['24510'], pop2020: 585708, pop2025: 565239 },
  { id: 'milwaukee', name: 'Milwaukee', state: 'WI', lat: 43.0389, lng: -87.9065, metro: 'Milwaukee-Waukesha', place: '5553000', cbsa: '33340', county: ['55079'], pop2020: 577222, pop2025: 561385 },
  { id: 'albuquerque', name: 'Albuquerque', state: 'NM', lat: 35.0844, lng: -106.6504, metro: 'Albuquerque', place: '3502000', cbsa: '10740', county: ['35001'], pop2020: 564559, pop2025: 560234 },
  { id: 'tucson', name: 'Tucson', state: 'AZ', lat: 32.2226, lng: -110.9747, metro: 'Tucson', place: '0477000', cbsa: '46060', county: ['04019'], pop2020: 542629, pop2025: 554336 },
  { id: 'fresno', name: 'Fresno', state: 'CA', lat: 36.7378, lng: -119.7871, metro: 'Fresno', place: '0627000', cbsa: '23420', county: ['06019'], pop2020: 542107, pop2025: 566153 },
  { id: 'sacramento', name: 'Sacramento', state: 'CA', lat: 38.5816, lng: -121.4944, metro: 'Sacramento-Roseville-Folsom', place: '0664000', cbsa: '40900', county: ['06067'], pop2020: 524943, pop2025: 535798 },
  { id: 'mesa', name: 'Mesa', state: 'AZ', lat: 33.4152, lng: -111.8315, metro: 'Phoenix-Mesa-Chandler', place: '0446000', cbsa: '38060', county: ['04013'], pop2020: 504258, pop2025: 517498 },
  { id: 'kansas-city', name: 'Kansas City', state: 'MO', lat: 39.0997, lng: -94.5786, metro: 'Kansas City', place: '2938000', cbsa: '28140', county: ['29095'], pop2020: 508090, pop2025: 516142 },
  { id: 'atlanta', name: 'Atlanta', state: 'GA', lat: 33.749, lng: -84.388, metro: 'Atlanta-Sandy Springs-Roswell', place: '1304000', cbsa: '12060', county: ['13121'], pop2020: 498715, pop2025: 520070 },
  { id: 'colorado-springs', name: 'Colorado Springs', state: 'CO', lat: 38.8339, lng: -104.8214, metro: 'Colorado Springs', place: '0816000', cbsa: '17820', county: ['08041'], pop2020: 478961, pop2025: 493530 },
  { id: 'omaha', name: 'Omaha', state: 'NE', lat: 41.2565, lng: -95.9345, metro: 'Omaha-Council Bluffs', place: '3137000', cbsa: '36540', county: ['31055'], pop2020: 486051, pop2025: 490130 },
  { id: 'raleigh', name: 'Raleigh', state: 'NC', lat: 35.7796, lng: -78.6382, metro: 'Raleigh-Cary', place: '3755000', cbsa: '39580', county: ['37183'], pop2020: 467665, pop2025: 499187 },
  { id: 'miami', name: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918, metro: 'Miami-Fort Lauderdale-West Palm Beach', place: '1245000', cbsa: '33100', county: ['12086'], pop2020: 442241, pop2025: 455924 },
  { id: 'virginia-beach', name: 'Virginia Beach', state: 'VA', lat: 36.8529, lng: -75.978, metro: 'Virginia Beach-Chesapeake-Norfolk', place: '5182000', cbsa: '47260', county: ['51810'], pop2020: 459470, pop2025: 453649 },
  { id: 'long-beach', name: 'Long Beach', state: 'CA', lat: 33.7701, lng: -118.1937, metro: 'Los Angeles-Long Beach-Anaheim', place: '0643000', cbsa: '31080', county: ['06037'], pop2020: 466742, pop2025: 451307 },
  { id: 'oakland', name: 'Oakland', state: 'CA', lat: 37.8044, lng: -122.2712, metro: 'San Francisco-Oakland-Fremont', place: '0653000', cbsa: '41860', county: ['06001'], pop2020: 440646, pop2025: 440646 },
  { id: 'minneapolis', name: 'Minneapolis', state: 'MN', lat: 44.9778, lng: -93.265, metro: 'Minneapolis-St. Paul-Bloomington', place: '2743000', cbsa: '33460', county: ['27053'], pop2020: 429954, pop2025: 425096 },
  { id: 'bakersfield', name: 'Bakersfield', state: 'CA', lat: 35.3733, lng: -119.0187, metro: 'Bakersfield-Delano', place: '0603526', cbsa: '12540', county: ['06029'], pop2020: 403455, pop2025: 417089 },
  { id: 'tulsa', name: 'Tulsa', state: 'OK', lat: 36.154, lng: -95.9928, metro: 'Tulsa', place: '4075000', cbsa: '46140', county: ['40143'], pop2020: 413066, pop2025: 413066 },
  { id: 'tampa', name: 'Tampa', state: 'FL', lat: 27.9506, lng: -82.4572, metro: 'Tampa-St. Petersburg-Clearwater', place: '1271000', cbsa: '45300', county: ['12057'], pop2020: 384959, pop2025: 414547 },
  { id: 'arlington-tx', name: 'Arlington', state: 'TX', lat: 32.7357, lng: -97.1081, metro: 'Dallas-Fort Worth-Arlington', place: '4804000', cbsa: '19100', county: ['48439'], pop2020: 394266, pop2025: 403588 },
]

const CITY_HOME: Record<string, [number, number]> = {
  'new-york': [658000, 745000],
  'los-angeles': [689000, 952000],
  chicago: [228000, 312000],
  houston: [198000, 278000],
  phoenix: [268000, 428000],
  philadelphia: [162000, 238000],
  'san-antonio': [188000, 268000],
  'san-diego': [598000, 918000],
  dallas: [218000, 328000],
  jacksonville: [198000, 312000],
  austin: [348000, 458000],
  'fort-worth': [218000, 328000],
  'san-jose': [1028000, 1388000],
  columbus: [168000, 248000],
  charlotte: [228000, 378000],
  indianapolis: [148000, 238000],
  'san-francisco': [1288000, 1328000],
  seattle: [688000, 848000],
  denver: [428000, 548000],
  'oklahoma-city': [148000, 218000],
  nashville: [268000, 448000],
  washington: [572000, 618000],
  'el-paso': [138000, 218000],
  'las-vegas': [278000, 428000],
  boston: [588000, 778000],
  detroit: [42000, 78000],
  portland: [412000, 528000],
  louisville: [148000, 228000],
  memphis: [98000, 148000],
  baltimore: [148000, 198000],
  milwaukee: [128000, 198000],
  albuquerque: [198000, 318000],
  tucson: [188000, 318000],
  fresno: [268000, 398000],
  sacramento: [368000, 498000],
  mesa: [248000, 428000],
  'kansas-city': [148000, 238000],
  atlanta: [248000, 398000],
  'colorado-springs': [298000, 448000],
  omaha: [168000, 268000],
  raleigh: [268000, 428000],
  miami: [348000, 548000],
  'virginia-beach': [268000, 378000],
  'long-beach': [588000, 848000],
  oakland: [688000, 818000],
  minneapolis: [248000, 328000],
  bakersfield: [248000, 368000],
  tulsa: [128000, 198000],
  tampa: [218000, 368000],
  'arlington-tx': [218000, 328000],
}

function round(n: number, d = 1) {
  const p = 10 ** d
  return Math.round(n * p) / p
}

export function buildFallbackCities(): CityEntity[] {
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
  const states = buildFallbackStates()
  return CITY_SEEDS.map((c) => {
    const a = CITY_ANCHORS[c.id] ?? {}
    const pop: YearSeries = seriesFromAnchors({ 2020: c.pop2020, 2025: c.pop2025 })
    pop['2019'] = Math.round(c.pop2020 * 0.992)
    const [home2019, home2025] = CITY_HOME[c.id] ?? [220000, 320000]
    const homeValue =
      a.homeValue && Object.keys(a.homeValue).length
        ? a.homeValue
        : seriesFromAnchors({ 2019: home2019, 2022: Math.round(home2019 * 1.22), 2025: home2025 })
    const medianAge = a.medianAge
      ? Object.fromEntries(
          Object.entries(
            seriesFromAnchors({ 2019: a.medianAge - 0.4, 2023: a.medianAge, 2025: a.medianAge + 0.1 }),
          ).map(([y, v]) => [y, round(v, 1)]),
        )
      : {}
    const gdp: YearSeries = { ...(a.gdpPerCapita ?? {}) }
    const stGdp = states[c.state]?.stats.gdpPerCapita
    if (gdp['2024'] && stGdp?.['2024'] && stGdp['2025']) {
      gdp['2025'] = Math.round(gdp['2024'] * (stGdp['2025'] / stGdp['2024']))
      if (stGdp['2026']) gdp['2026'] = Math.round(gdp['2025'] * (stGdp['2026'] / stGdp['2025']))
    }
    const demographics: Record<string, DemographicShares> = {}
    const diversityIndexSeries: YearSeries = {}
    const ageDistribution: Record<string, AgeBuckets> = {}
    for (const y of years) {
      if (a.demo) {
        demographics[String(y)] = a.demo
        diversityIndexSeries[String(y)] = diversityIndex(a.demo)
      }
      if (a.age) ageDistribution[String(y)] = a.age
    }
    const violentCrime: YearSeries = {}
    const propertyCrime: YearSeries = {}
    const crimeRate: YearSeries = {}
    if (a.violent !== undefined && a.property !== undefined) {
      for (const y of [2024, 2025, 2026]) {
        violentCrime[String(y)] = a.violent
        propertyCrime[String(y)] = a.property
        crimeRate[String(y)] = round(a.violent + a.property, 1)
      }
    }
    const industries: Record<string, Industry[]> = {}
    for (const y of years) {
      const pc = gdp[String(y)]
      const p = pop[String(y)]
      industries[String(y)] = (a.industries ?? []).map(([sector, share]) => ({
        sector,
        share,
        gdp: pc && p ? round((pc * p * share) / 1_000_000, 1) : 0,
      }))
    }
    const partial: Record<string, number[]> = {
      unemploymentRate: [2026],
      jobGrowth: [2026],
      homeValue: [2026],
    }
    if (a.violent !== undefined) partial.crimeRate = [2025, 2026]
    return {
      id: c.id,
      name: c.name,
      level: 'city' as const,
      state: c.state,
      lat: c.lat,
      lng: c.lng,
      metro: c.metro,
      stats: {
        population: pop,
        medianAge,
        ageDistribution,
        demographics,
        diversityIndex: diversityIndexSeries,
        costOfLiving: a.costOfLiving ?? {},
        rentIndex: a.rentIndex ?? {},
        homeValue,
        employment: a.employment ?? {},
        jobGrowth: a.jobGrowth ?? {},
        unemploymentRate: a.unemploymentRate ?? {},
        violentCrime,
        propertyCrime,
        crimeRate,
        gdpPerCapita: gdp,
        industries,
      },
      partial,
    }
  })
}
