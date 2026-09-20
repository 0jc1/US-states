import type { CityEntity, YearSeries } from '../../src/lib/types.ts'
import { diversityIndex, seriesFromAnchors } from './fallback.ts'
import { buildFallbackStates } from './fallback.ts'

export interface CitySeed {
  id: string
  name: string
  state: string
  lat: number
  lng: number
  metro: string
  pop2020: number
  pop2025: number
}

/** 50 largest US cities by 2025 Census city-limits estimates, with Gazetteer coordinates. */
export const CITY_SEEDS: CitySeed[] = [
  { id: 'new-york', name: 'New York', state: 'NY', lat: 40.7128, lng: -74.006, metro: 'New York-Newark-Jersey City', pop2020: 8804190, pop2025: 8478072 },
  { id: 'los-angeles', name: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437, metro: 'Los Angeles-Long Beach-Anaheim', pop2020: 3898747, pop2025: 3875322 },
  { id: 'chicago', name: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298, metro: 'Chicago-Naperville-Elgin', pop2020: 2746388, pop2025: 2665039 },
  { id: 'houston', name: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698, metro: 'Houston-Pasadena-The Woodlands', pop2020: 2304580, pop2025: 2390125 },
  { id: 'phoenix', name: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.074, metro: 'Phoenix-Mesa-Chandler', pop2020: 1608139, pop2025: 1708127 },
  { id: 'philadelphia', name: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652, metro: 'Philadelphia-Camden-Wilmington', pop2020: 1603797, pop2025: 1576251 },
  { id: 'san-antonio', name: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936, metro: 'San Antonio-New Braunfels', pop2020: 1434625, pop2025: 1514736 },
  { id: 'san-diego', name: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611, metro: 'San Diego-Chula Vista-Carlsbad', pop2020: 1386932, pop2025: 1404452 },
  { id: 'dallas', name: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.797, metro: 'Dallas-Fort Worth-Arlington', pop2020: 1304379, pop2025: 1331107 },
  { id: 'jacksonville', name: 'Jacksonville', state: 'FL', lat: 30.3322, lng: -81.6557, metro: 'Jacksonville', pop2020: 949611, pop2025: 1002151 },
  { id: 'austin', name: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431, metro: 'Austin-Round Rock-San Marcos', pop2020: 961855, pop2025: 984567 },
  { id: 'fort-worth', name: 'Fort Worth', state: 'TX', lat: 32.7555, lng: -97.3308, metro: 'Dallas-Fort Worth-Arlington', pop2020: 918915, pop2025: 996525 },
  { id: 'san-jose', name: 'San Jose', state: 'CA', lat: 37.3382, lng: -121.8863, metro: 'San Jose-Sunnyvale-Santa Clara', pop2020: 1013240, pop2025: 997368 },
  { id: 'columbus', name: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988, metro: 'Columbus', pop2020: 905748, pop2025: 933263 },
  { id: 'charlotte', name: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431, metro: 'Charlotte-Concord-Gastonia', pop2020: 874579, pop2025: 943476 },
  { id: 'indianapolis', name: 'Indianapolis', state: 'IN', lat: 39.7684, lng: -86.1581, metro: 'Indianapolis-Carmel-Greenwood', pop2020: 887642, pop2025: 891484 },
  { id: 'san-francisco', name: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194, metro: 'San Francisco-Oakland-Fremont', pop2020: 873965, pop2025: 827526 },
  { id: 'seattle', name: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321, metro: 'Seattle-Tacoma-Bellevue', pop2020: 737015, pop2025: 780995 },
  { id: 'denver', name: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903, metro: 'Denver-Aurora-Centennial', pop2020: 715522, pop2025: 729019 },
  { id: 'oklahoma-city', name: 'Oklahoma City', state: 'OK', lat: 35.4676, lng: -97.5164, metro: 'Oklahoma City', pop2020: 681054, pop2025: 712919 },
  { id: 'nashville', name: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816, metro: 'Nashville-Davidson-Murfreesboro', pop2020: 689447, pop2025: 704897 },
  { id: 'washington', name: 'Washington', state: 'DC', lat: 38.9072, lng: -77.0369, metro: 'Washington-Arlington-Alexandria', pop2020: 689545, pop2025: 711736 },
  { id: 'el-paso', name: 'El Paso', state: 'TX', lat: 31.7619, lng: -106.485, metro: 'El Paso', pop2020: 678815, pop2025: 681723 },
  { id: 'las-vegas', name: 'Las Vegas', state: 'NV', lat: 36.1699, lng: -115.1398, metro: 'Las Vegas-Henderson-Paradise', pop2020: 641903, pop2025: 678922 },
  { id: 'boston', name: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589, metro: 'Boston-Cambridge-Newton', pop2020: 675647, pop2025: 673862 },
  { id: 'detroit', name: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458, metro: 'Detroit-Warren-Dearborn', pop2020: 639111, pop2025: 645705 },
  { id: 'portland', name: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784, metro: 'Portland-Vancouver-Hillsboro', pop2020: 652503, pop2025: 635067 },
  { id: 'louisville', name: 'Louisville', state: 'KY', lat: 38.2527, lng: -85.7585, metro: 'Louisville/Jefferson County', pop2020: 633045, pop2025: 640616 },
  { id: 'memphis', name: 'Memphis', state: 'TN', lat: 35.1495, lng: -90.049, metro: 'Memphis', pop2020: 633104, pop2025: 610861 },
  { id: 'baltimore', name: 'Baltimore', state: 'MD', lat: 39.2904, lng: -76.6122, metro: 'Baltimore-Columbia-Towson', pop2020: 585708, pop2025: 565239 },
  { id: 'milwaukee', name: 'Milwaukee', state: 'WI', lat: 43.0389, lng: -87.9065, metro: 'Milwaukee-Waukesha', pop2020: 577222, pop2025: 561385 },
  { id: 'albuquerque', name: 'Albuquerque', state: 'NM', lat: 35.0844, lng: -106.6504, metro: 'Albuquerque', pop2020: 564559, pop2025: 560234 },
  { id: 'tucson', name: 'Tucson', state: 'AZ', lat: 32.2226, lng: -110.9747, metro: 'Tucson', pop2020: 542629, pop2025: 554336 },
  { id: 'fresno', name: 'Fresno', state: 'CA', lat: 36.7378, lng: -119.7871, metro: 'Fresno', pop2020: 542107, pop2025: 566153 },
  { id: 'sacramento', name: 'Sacramento', state: 'CA', lat: 38.5816, lng: -121.4944, metro: 'Sacramento-Roseville-Folsom', pop2020: 524943, pop2025: 535798 },
  { id: 'mesa', name: 'Mesa', state: 'AZ', lat: 33.4152, lng: -111.8315, metro: 'Phoenix-Mesa-Chandler', pop2020: 504258, pop2025: 517498 },
  { id: 'kansas-city', name: 'Kansas City', state: 'MO', lat: 39.0997, lng: -94.5786, metro: 'Kansas City', pop2020: 508090, pop2025: 516142 },
  { id: 'atlanta', name: 'Atlanta', state: 'GA', lat: 33.749, lng: -84.388, metro: 'Atlanta-Sandy Springs-Roswell', pop2020: 498715, pop2025: 520070 },
  { id: 'colorado-springs', name: 'Colorado Springs', state: 'CO', lat: 38.8339, lng: -104.8214, metro: 'Colorado Springs', pop2020: 478961, pop2025: 493530 },
  { id: 'omaha', name: 'Omaha', state: 'NE', lat: 41.2565, lng: -95.9345, metro: 'Omaha-Council Bluffs', pop2020: 486051, pop2025: 490130 },
  { id: 'raleigh', name: 'Raleigh', state: 'NC', lat: 35.7796, lng: -78.6382, metro: 'Raleigh-Cary', pop2020: 467665, pop2025: 499187 },
  { id: 'miami', name: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918, metro: 'Miami-Fort Lauderdale-West Palm Beach', pop2020: 442241, pop2025: 455924 },
  { id: 'virginia-beach', name: 'Virginia Beach', state: 'VA', lat: 36.8529, lng: -75.978, metro: 'Virginia Beach-Chesapeake-Norfolk', pop2020: 459470, pop2025: 453649 },
  { id: 'long-beach', name: 'Long Beach', state: 'CA', lat: 33.7701, lng: -118.1937, metro: 'Los Angeles-Long Beach-Anaheim', pop2020: 466742, pop2025: 451307 },
  { id: 'oakland', name: 'Oakland', state: 'CA', lat: 37.8044, lng: -122.2712, metro: 'San Francisco-Oakland-Fremont', pop2020: 440646, pop2025: 440646 },
  { id: 'minneapolis', name: 'Minneapolis', state: 'MN', lat: 44.9778, lng: -93.265, metro: 'Minneapolis-St. Paul-Bloomington', pop2020: 429954, pop2025: 425096 },
  { id: 'bakersfield', name: 'Bakersfield', state: 'CA', lat: 35.3733, lng: -119.0187, metro: 'Bakersfield-Delano', pop2020: 403455, pop2025: 417089 },
  { id: 'tulsa', name: 'Tulsa', state: 'OK', lat: 36.154, lng: -95.9928, metro: 'Tulsa', pop2020: 413066, pop2025: 413066 },
  { id: 'tampa', name: 'Tampa', state: 'FL', lat: 27.9506, lng: -82.4572, metro: 'Tampa-St. Petersburg-Clearwater', pop2020: 384959, pop2025: 414547 },
  { id: 'arlington-tx', name: 'Arlington', state: 'TX', lat: 32.7357, lng: -97.1081, metro: 'Dallas-Fort Worth-Arlington', pop2020: 394266, pop2025: 403588 },
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

export function buildFallbackCities(): CityEntity[] {
  const states = buildFallbackStates()
  return CITY_SEEDS.map((c) => {
    const st = states[c.state]
    const pop: YearSeries = seriesFromAnchors({ 2020: c.pop2020, 2025: c.pop2025 })
    pop['2019'] = Math.round(c.pop2020 * 0.992)
    const [home2019, home2025] = CITY_HOME[c.id] ?? [220000, 320000]
    const homeValue = seriesFromAnchors({ 2019: home2019, 2022: Math.round(home2019 * 1.22), 2025: home2025 })
    const rppBoost = c.id === 'san-francisco' || c.id === 'new-york' || c.id === 'san-jose' ? 18 : c.id === 'detroit' || c.id === 'memphis' ? -8 : 4
    const costOfLiving: YearSeries = {}
    const rentIndex: YearSeries = {}
    const unemploymentRate: YearSeries = {}
    const jobGrowth: YearSeries = {}
    const gdpPerCapita: YearSeries = {}
    const crimeRate: YearSeries = {}
    const violentCrime: YearSeries = {}
    const propertyCrime: YearSeries = {}
    for (const y of Object.keys(st.stats.costOfLiving ?? {})) {
      costOfLiving[y] = Math.round(((st.stats.costOfLiving?.[y] ?? 100) + rppBoost) * 10) / 10
      rentIndex[y] = Math.round(((st.stats.rentIndex?.[y] ?? 100) + rppBoost * 1.4) * 10) / 10
      unemploymentRate[y] = Math.round(((st.stats.unemploymentRate?.[y] ?? 4) + 0.4) * 10) / 10
      jobGrowth[y] = Math.round(((st.stats.jobGrowth?.[y] ?? 1) + 0.15) * 100) / 100
      gdpPerCapita[y] = Math.round((st.stats.gdpPerCapita?.[y] ?? 60000) * 1.08)
      const crimeBoost = ['detroit', 'memphis', 'baltimore', 'st-louis', 'atlanta'].includes(c.id) ? 1.45 : 1.12
      violentCrime[y] = Math.round((st.stats.violentCrime?.[y] ?? 400) * crimeBoost)
      propertyCrime[y] = Math.round((st.stats.propertyCrime?.[y] ?? 1800) * crimeBoost)
      crimeRate[y] = violentCrime[y] + propertyCrime[y]
    }
    const demographics = st.stats.demographics ?? {}
    const diversity: YearSeries = {}
    for (const [y, d] of Object.entries(demographics)) diversity[y] = diversityIndex(d)
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
        medianAge: st.stats.medianAge,
        ageDistribution: st.stats.ageDistribution,
        demographics,
        diversityIndex: diversity,
        costOfLiving,
        rentIndex,
        homeValue,
        employment: st.stats.employment,
        jobGrowth,
        unemploymentRate,
        violentCrime,
        propertyCrime,
        crimeRate,
        gdpPerCapita,
        industries: st.stats.industries,
      },
      partial: { unemploymentRate: [2026], jobGrowth: [2026], homeValue: [2026] },
    }
  })
}
