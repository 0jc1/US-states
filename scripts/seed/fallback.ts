import type { AgeBuckets, DemographicShares, Industry, StateEntity, YearSeries } from '../../src/lib/types.ts'
import { STATES } from '../lib/states.ts'
import { GDP_BILLIONS } from './gdp.ts'

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026] as const

/** Interpolate (and lightly extrapolate 2026) through known anchor years. */
export function seriesFromAnchors(anchors: Record<number, number>, extras?: { growth2026?: number }): YearSeries {
  const known = Object.keys(anchors)
    .map(Number)
    .sort((a, b) => a - b)
  const out: YearSeries = {}
  for (const y of YEARS) {
    if (anchors[y] !== undefined) {
      out[String(y)] = anchors[y]
      continue
    }
    if (y === 2026) {
      const g = extras?.growth2026 ?? relative(anchors[2024], anchors[2025])
      if (anchors[2025] !== undefined && Number.isFinite(g)) {
        out['2026'] = round(anchors[2025] * (1 + g), 4)
      }
      continue
    }
    let lo = known[0]
    let hi = known[known.length - 1]
    for (const k of known) {
      if (k <= y) lo = k
      if (k >= y) {
        hi = k
        break
      }
    }
    if (lo === hi) {
      out[String(y)] = anchors[lo]
      continue
    }
    const t = (y - lo) / (hi - lo)
    out[String(y)] = anchors[lo] + t * (anchors[hi] - anchors[lo])
  }
  return out
}

function relative(a?: number, b?: number) {
  if (!a || !b) return 0.004
  return (b - a) / Math.abs(a)
}

function round(n: number, d = 1) {
  const p = 10 ** d
  return Math.round(n * p) / p
}

function lerpShare(a: DemographicShares, b: DemographicShares, t: number): DemographicShares {
  const o = { ...a }
  ;(Object.keys(a) as (keyof DemographicShares)[]).forEach((k) => {
    o[k] = a[k] + t * (b[k] - a[k])
  })
  return o
}

export function diversityIndex(s: DemographicShares): number {
  const sumSq = Object.values(s).reduce((acc, p) => acc + p * p, 0)
  return round((1 - sumSq) * 100, 2)
}

type Anchor = {
  pop2020: number
  pop2024: number
  pop2025: number
  medianAge: number
  /** ACS-style non-Hispanic / Hispanic shares, ~2023 */
  demo: DemographicShares
  age: AgeBuckets
  rpp: number
  rent: number
  home2025: number
  home2019: number
  unemp2025: number
  unemp2019: number
  jobs2025: number
  jobs2019: number
  gdp2025e12: number
  violent: number
  property: number
  industries: [string, number][]
}

/**
 * Compact official-vintage anchors.
 * Population: Census 2020 count + Vintage 2024/2025 July 1 estimates (Census NST-EST).
 * Age/demographics: ACS 1-year 2023/2024.
 * RPP: BEA Regional Price Parities (all-items / rents).
 * Home value: Zillow ZHVI typical home, rounded.
 * Unemployment / jobs: BLS LAUS + CES.
 * GDP: BEA SAGDP1 current-dollar (see gdp.ts). 2026 uses that state's 2024→2025 growth.
 * Crime: FBI CDE violent + property per 100k (latest complete year only; later years fill-forward).
 * Live fetch overlays replace these when the source download succeeds.
 */
const ANCHORS: Record<string, Anchor> = {
  AL: { pop2020: 5024279, pop2024: 5157699, pop2025: 5198525, medianAge: 39.6, demo: { white: 0.635, hispanic: 0.055, black: 0.265, asian: 0.016, native: 0.005, pacific: 0.001, multi: 0.023 }, age: { '0-17': 0.218, '18-34': 0.218, '35-54': 0.248, '55-64': 0.132, '65+': 0.184 }, rpp: 88.2, rent: 73.4, home2025: 228000, home2019: 145000, unemp2025: 3.3, unemp2019: 3.0, jobs2025: 2210, jobs2019: 2075, gdp2025e12: 312, violent: 409, property: 1930, industries: [['Manufacturing', 0.17], ['Real estate', 0.13], ['Government', 0.14], ['Health care', 0.09], ['Retail', 0.07]] },
  AK: { pop2020: 733391, pop2024: 740133, pop2025: 741504, medianAge: 35.6, demo: { white: 0.578, hispanic: 0.076, black: 0.032, asian: 0.066, native: 0.152, pacific: 0.016, multi: 0.08 }, age: { '0-17': 0.242, '18-34': 0.248, '35-54': 0.248, '55-64': 0.122, '65+': 0.14 }, rpp: 102.4, rent: 116.8, home2025: 379000, home2019: 291000, unemp2025: 4.6, unemp2019: 5.4, jobs2025: 335, jobs2019: 327, gdp2025e12: 67, violent: 740, property: 2260, industries: [['Mining and oil', 0.22], ['Government', 0.21], ['Transportation', 0.1], ['Health care', 0.08], ['Real estate', 0.08]] },
  AZ: { pop2020: 7151502, pop2024: 7582384, pop2025: 7700280, medianAge: 38.8, demo: { white: 0.523, hispanic: 0.318, black: 0.047, asian: 0.037, native: 0.039, pacific: 0.003, multi: 0.033 }, age: { '0-17': 0.218, '18-34': 0.228, '35-54': 0.242, '55-64': 0.118, '65+': 0.194 }, rpp: 102.1, rent: 112.4, home2025: 435000, home2019: 257000, unemp2025: 4.1, unemp2019: 4.8, jobs2025: 3280, jobs2019: 2955, gdp2025e12: 570, violent: 431, property: 2205, industries: [['Real estate', 0.16], ['Professional services', 0.09], ['Government', 0.12], ['Health care', 0.09], ['Manufacturing', 0.08]] },
  AR: { pop2020: 3011524, pop2024: 3088354, pop2025: 3111625, medianAge: 38.9, demo: { white: 0.699, hispanic: 0.087, black: 0.151, asian: 0.017, native: 0.008, pacific: 0.004, multi: 0.034 }, age: { '0-17': 0.232, '18-34': 0.218, '35-54': 0.244, '55-64': 0.128, '65+': 0.178 }, rpp: 86.9, rent: 70.1, home2025: 215000, home2019: 134000, unemp2025: 3.5, unemp2019: 3.5, jobs2025: 1385, jobs2019: 1288, gdp2025e12: 188, violent: 645, property: 2460, industries: [['Manufacturing', 0.14], ['Government', 0.13], ['Real estate', 0.12], ['Health care', 0.09], ['Retail', 0.08]] },
  CA: { pop2020: 39538223, pop2024: 39431263, pop2025: 39431017, medianAge: 37.9, demo: { white: 0.342, hispanic: 0.402, black: 0.053, asian: 0.155, native: 0.004, pacific: 0.004, multi: 0.04 }, age: { '0-17': 0.218, '18-34': 0.242, '35-54': 0.262, '55-64': 0.118, '65+': 0.16 }, rpp: 112.4, rent: 148.6, home2025: 792000, home2019: 554000, unemp2025: 5.4, unemp2019: 4.1, jobs2025: 18120, jobs2019: 17540, gdp2025e12: 4120, violent: 442, property: 2330, industries: [['Information', 0.12], ['Professional services', 0.13], ['Real estate', 0.15], ['Manufacturing', 0.1], ['Government', 0.1]] },
  CO: { pop2020: 5773714, pop2024: 5957494, pop2025: 6010883, medianAge: 37.7, demo: { white: 0.651, hispanic: 0.224, black: 0.041, asian: 0.035, native: 0.007, pacific: 0.002, multi: 0.04 }, age: { '0-17': 0.212, '18-34': 0.242, '35-54': 0.268, '55-64': 0.118, '65+': 0.16 }, rpp: 103.2, rent: 124.8, home2025: 552000, home2019: 398000, unemp2025: 4.3, unemp2019: 2.7, jobs2025: 2975, jobs2019: 2788, gdp2025e12: 555, violent: 476, property: 2680, industries: [['Professional services', 0.12], ['Real estate', 0.15], ['Government', 0.11], ['Information', 0.07], ['Health care', 0.08]] },
  CT: { pop2020: 3605944, pop2024: 3675069, pop2025: 3692933, medianAge: 41.2, demo: { white: 0.63, hispanic: 0.181, black: 0.107, asian: 0.049, native: 0.002, pacific: 0.001, multi: 0.03 }, age: { '0-17': 0.202, '18-34': 0.208, '35-54': 0.258, '55-64': 0.142, '65+': 0.19 }, rpp: 106.8, rent: 118.2, home2025: 428000, home2019: 273000, unemp2025: 3.7, unemp2019: 3.6, jobs2025: 1718, jobs2019: 1695, gdp2025e12: 352, violent: 202, property: 1410, industries: [['Finance and insurance', 0.16], ['Real estate', 0.14], ['Manufacturing', 0.11], ['Health care', 0.1], ['Professional services', 0.09]] },
  DE: { pop2020: 989948, pop2024: 1051917, pop2025: 1066972, medianAge: 41.7, demo: { white: 0.592, hispanic: 0.104, black: 0.226, asian: 0.042, native: 0.004, pacific: 0.001, multi: 0.031 }, age: { '0-17': 0.208, '18-34': 0.208, '35-54': 0.242, '55-64': 0.138, '65+': 0.204 }, rpp: 97.4, rent: 102.1, home2025: 388000, home2019: 258000, unemp2025: 3.9, unemp2019: 3.7, jobs2025: 492, jobs2019: 465, gdp2025e12: 94, violent: 388, property: 1950, industries: [['Finance and insurance', 0.28], ['Real estate', 0.12], ['Government', 0.11], ['Health care', 0.09], ['Professional services', 0.08]] },
  DC: { pop2020: 689545, pop2024: 702250, pop2025: 711736, medianAge: 34.9, demo: { white: 0.38, hispanic: 0.119, black: 0.428, asian: 0.042, native: 0.003, pacific: 0.001, multi: 0.027 }, age: { '0-17': 0.182, '18-34': 0.338, '35-54': 0.262, '55-64': 0.098, '65+': 0.12 }, rpp: 111.4, rent: 158.2, home2025: 618000, home2019: 572000, unemp2025: 5.4, unemp2019: 5.4, jobs2025: 772, jobs2019: 798, gdp2025e12: 186, violent: 812, property: 3180, industries: [['Government', 0.32], ['Professional services', 0.22], ['Real estate', 0.12], ['Finance and insurance', 0.06], ['Education', 0.05]] },
  FL: { pop2020: 21538187, pop2024: 23222945, pop2025: 23781051, medianAge: 42.8, demo: { white: 0.512, hispanic: 0.272, black: 0.151, asian: 0.03, native: 0.003, pacific: 0.001, multi: 0.031 }, age: { '0-17': 0.192, '18-34': 0.208, '35-54': 0.242, '55-64': 0.132, '65+': 0.226 }, rpp: 102.8, rent: 123.6, home2025: 405000, home2019: 247000, unemp2025: 3.6, unemp2019: 3.2, jobs2025: 10180, jobs2019: 8965, gdp2025e12: 1725, violent: 384, property: 1865, industries: [['Real estate', 0.18], ['Professional services', 0.09], ['Health care', 0.09], ['Retail', 0.08], ['Government', 0.1]] },
  GA: { pop2020: 10711908, pop2024: 11180878, pop2025: 11327798, medianAge: 37.6, demo: { white: 0.501, hispanic: 0.105, black: 0.325, asian: 0.046, native: 0.003, pacific: 0.001, multi: 0.019 }, age: { '0-17': 0.232, '18-34': 0.228, '35-54': 0.262, '55-64': 0.122, '65+': 0.156 }, rpp: 96.1, rent: 96.8, home2025: 342000, home2019: 202000, unemp2025: 3.6, unemp2019: 3.4, jobs2025: 5025, jobs2019: 4612, gdp2025e12: 882, violent: 367, property: 2070, industries: [['Real estate', 0.14], ['Professional services', 0.1], ['Government', 0.11], ['Manufacturing', 0.1], ['Transportation', 0.08]] },
  HI: { pop2020: 1455271, pop2024: 1446146, pop2025: 1446146, medianAge: 40.8, demo: { white: 0.216, hispanic: 0.106, black: 0.018, asian: 0.369, native: 0.002, pacific: 0.104, multi: 0.185 }, age: { '0-17': 0.208, '18-34': 0.218, '35-54': 0.248, '55-64': 0.128, '65+': 0.198 }, rpp: 113.0, rent: 154.2, home2025: 848000, home2019: 721000, unemp2025: 3.0, unemp2019: 2.6, jobs2025: 648, jobs2019: 658, gdp2025e12: 117, violent: 255, property: 2410, industries: [['Real estate', 0.16], ['Government', 0.18], ['Accommodation', 0.1], ['Health care', 0.08], ['Retail', 0.07]] },
  ID: { pop2020: 1839106, pop2024: 2001619, pop2025: 2032420, medianAge: 37.5, demo: { white: 0.793, hispanic: 0.139, black: 0.009, asian: 0.016, native: 0.013, pacific: 0.002, multi: 0.028 }, age: { '0-17': 0.248, '18-34': 0.218, '35-54': 0.242, '55-64': 0.118, '65+': 0.174 }, rpp: 94.6, rent: 96.2, home2025: 458000, home2019: 259000, unemp2025: 3.6, unemp2019: 2.9, jobs2025: 872, jobs2019: 762, gdp2025e12: 128, violent: 241, property: 1120, industries: [['Manufacturing', 0.12], ['Real estate', 0.14], ['Government', 0.12], ['Agriculture', 0.08], ['Health care', 0.08]] },
  IL: { pop2020: 12812508, pop2024: 12710158, pop2025: 12710161, medianAge: 39.0, demo: { white: 0.585, hispanic: 0.186, black: 0.136, asian: 0.061, native: 0.002, pacific: 0.001, multi: 0.029 }, age: { '0-17': 0.218, '18-34': 0.228, '35-54': 0.252, '55-64': 0.128, '65+': 0.174 }, rpp: 100.2, rent: 104.6, home2025: 278000, home2019: 202000, unemp2025: 5.0, unemp2019: 4.0, jobs2025: 6188, jobs2019: 6155, gdp2025e12: 1135, violent: 426, property: 1788, industries: [['Professional services', 0.11], ['Manufacturing', 0.12], ['Real estate', 0.14], ['Finance and insurance', 0.09], ['Government', 0.1]] },
  IN: { pop2020: 6785528, pop2024: 6924275, pop2025: 6969695, medianAge: 38.2, demo: { white: 0.762, hispanic: 0.08, black: 0.096, asian: 0.027, native: 0.002, pacific: 0.001, multi: 0.032 }, age: { '0-17': 0.232, '18-34': 0.222, '35-54': 0.248, '55-64': 0.128, '65+': 0.17 }, rpp: 91.6, rent: 82.4, home2025: 248000, home2019: 156000, unemp2025: 4.0, unemp2019: 3.3, jobs2025: 3288, jobs2019: 3165, gdp2025e12: 512, violent: 357, property: 1680, industries: [['Manufacturing', 0.26], ['Real estate', 0.12], ['Health care', 0.09], ['Government', 0.1], ['Retail', 0.07]] },
  IA: { pop2020: 3190369, pop2024: 3214315, pop2025: 3222778, medianAge: 38.7, demo: { white: 0.834, hispanic: 0.071, black: 0.041, asian: 0.027, native: 0.004, pacific: 0.001, multi: 0.022 }, age: { '0-17': 0.228, '18-34': 0.218, '35-54': 0.238, '55-64': 0.132, '65+': 0.184 }, rpp: 90.1, rent: 76.8, home2025: 226000, home2019: 152000, unemp2025: 3.4, unemp2019: 2.7, jobs2025: 1598, jobs2019: 1582, gdp2025e12: 258, violent: 287, property: 1555, industries: [['Manufacturing', 0.18], ['Agriculture', 0.08], ['Real estate', 0.12], ['Finance and insurance', 0.1], ['Government', 0.11]] },
  KS: { pop2020: 2937880, pop2024: 2970606, pop2025: 2978788, medianAge: 37.6, demo: { white: 0.742, hispanic: 0.132, black: 0.056, asian: 0.031, native: 0.008, pacific: 0.001, multi: 0.03 }, age: { '0-17': 0.238, '18-34': 0.228, '35-54': 0.238, '55-64': 0.122, '65+': 0.174 }, rpp: 90.4, rent: 79.2, home2025: 238000, home2019: 154000, unemp2025: 3.6, unemp2019: 3.2, jobs2025: 1455, jobs2019: 1422, gdp2025e12: 235, violent: 414, property: 2240, industries: [['Manufacturing', 0.14], ['Government', 0.13], ['Real estate', 0.12], ['Agriculture', 0.07], ['Health care', 0.08]] },
  KY: { pop2020: 4505836, pop2024: 4588372, pop2025: 4616102, medianAge: 39.4, demo: { white: 0.831, hispanic: 0.047, black: 0.082, asian: 0.017, native: 0.002, pacific: 0.001, multi: 0.02 }, age: { '0-17': 0.222, '18-34': 0.218, '35-54': 0.248, '55-64': 0.132, '65+': 0.18 }, rpp: 88.9, rent: 73.8, home2025: 218000, home2019: 146000, unemp2025: 4.9, unemp2019: 4.1, jobs2025: 2048, jobs2019: 1945, gdp2025e12: 294, violent: 259, property: 1550, industries: [['Manufacturing', 0.17], ['Government', 0.13], ['Health care', 0.1], ['Real estate', 0.12], ['Retail', 0.07]] },
  LA: { pop2020: 4657757, pop2024: 4593213, pop2025: 4573749, medianAge: 38.0, demo: { white: 0.567, hispanic: 0.069, black: 0.318, asian: 0.019, native: 0.006, pacific: 0.001, multi: 0.02 }, age: { '0-17': 0.232, '18-34': 0.228, '35-54': 0.242, '55-64': 0.128, '65+': 0.17 }, rpp: 91.2, rent: 82.6, home2025: 208000, home2019: 166000, unemp2025: 4.3, unemp2019: 4.7, jobs2025: 1962, jobs2019: 1995, gdp2025e12: 328, violent: 629, property: 2705, industries: [['Mining and oil', 0.14], ['Manufacturing', 0.12], ['Government', 0.13], ['Real estate', 0.12], ['Health care', 0.09]] },
  ME: { pop2020: 1362359, pop2024: 1405012, pop2025: 1411724, medianAge: 44.8, demo: { white: 0.913, hispanic: 0.021, black: 0.018, asian: 0.013, native: 0.006, pacific: 0.001, multi: 0.028 }, age: { '0-17': 0.182, '18-34': 0.188, '35-54': 0.242, '55-64': 0.152, '65+': 0.236 }, rpp: 98.6, rent: 99.4, home2025: 398000, home2019: 226000, unemp2025: 3.2, unemp2019: 2.9, jobs2025: 658, jobs2019: 632, gdp2025e12: 98, violent: 103, property: 1220, industries: [['Health care', 0.12], ['Government', 0.13], ['Real estate', 0.14], ['Retail', 0.08], ['Manufacturing', 0.1]] },
  MD: { pop2020: 6177224, pop2024: 6263220, pop2025: 6306031, medianAge: 39.3, demo: { white: 0.475, hispanic: 0.119, black: 0.293, asian: 0.068, native: 0.003, pacific: 0.001, multi: 0.041 }, age: { '0-17': 0.218, '18-34': 0.218, '35-54': 0.262, '55-64': 0.132, '65+': 0.17 }, rpp: 107.8, rent: 131.4, home2025: 428000, home2019: 318000, unemp2025: 3.2, unemp2019: 3.5, jobs2025: 2822, jobs2019: 2775, gdp2025e12: 530, violent: 398, property: 1688, industries: [['Government', 0.18], ['Professional services', 0.14], ['Real estate', 0.14], ['Health care', 0.09], ['Education', 0.05]] },
  MA: { pop2020: 7029917, pop2024: 7131428, pop2025: 7158923, medianAge: 40.3, demo: { white: 0.678, hispanic: 0.129, black: 0.071, asian: 0.075, native: 0.002, pacific: 0.001, multi: 0.044 }, age: { '0-17': 0.198, '18-34': 0.238, '35-54': 0.252, '55-64': 0.132, '65+': 0.18 }, rpp: 109.6, rent: 138.8, home2025: 642000, home2019: 422000, unemp2025: 4.1, unemp2019: 2.9, jobs2025: 3755, jobs2019: 3688, gdp2025e12: 778, violent: 308, property: 1175, industries: [['Professional services', 0.16], ['Real estate', 0.14], ['Health care', 0.1], ['Finance and insurance', 0.09], ['Manufacturing', 0.09]] },
  MI: { pop2020: 10077331, pop2024: 10140455, pop2025: 10140606, medianAge: 40.2, demo: { white: 0.736, hispanic: 0.058, black: 0.136, asian: 0.035, native: 0.005, pacific: 0.001, multi: 0.029 }, age: { '0-17': 0.212, '18-34': 0.222, '35-54': 0.242, '55-64': 0.138, '65+': 0.186 }, rpp: 93.6, rent: 86.2, home2025: 258000, home2019: 162000, unemp2025: 5.0, unemp2019: 4.1, jobs2025: 4488, jobs2019: 4452, gdp2025e12: 712, violent: 461, property: 1530, industries: [['Manufacturing', 0.18], ['Real estate', 0.13], ['Health care', 0.1], ['Professional services', 0.08], ['Government', 0.1]] },
  MN: { pop2020: 5706494, pop2024: 5787008, pop2025: 5815069, medianAge: 38.8, demo: { white: 0.772, hispanic: 0.062, black: 0.071, asian: 0.053, native: 0.011, pacific: 0.001, multi: 0.03 }, age: { '0-17': 0.228, '18-34': 0.218, '35-54': 0.252, '55-64': 0.128, '65+': 0.174 }, rpp: 97.8, rent: 98.6, home2025: 348000, home2019: 246000, unemp2025: 3.3, unemp2019: 3.2, jobs2025: 3018, jobs2019: 2975, gdp2025e12: 498, violent: 281, property: 1865, industries: [['Manufacturing', 0.13], ['Professional services', 0.1], ['Health care', 0.1], ['Real estate', 0.13], ['Finance and insurance', 0.08]] },
  MS: { pop2020: 2961279, pop2024: 2940454, pop2025: 2939690, medianAge: 38.6, demo: { white: 0.558, hispanic: 0.037, black: 0.376, asian: 0.011, native: 0.005, pacific: 0.001, multi: 0.012 }, age: { '0-17': 0.238, '18-34': 0.218, '35-54': 0.242, '55-64': 0.128, '65+': 0.174 }, rpp: 85.8, rent: 68.4, home2025: 182000, home2019: 128000, unemp2025: 3.9, unemp2019: 5.5, jobs2025: 1188, jobs2019: 1165, gdp2025e12: 156, violent: 245, property: 1990, industries: [['Government', 0.16], ['Manufacturing', 0.15], ['Health care', 0.1], ['Real estate', 0.11], ['Retail', 0.08]] },
  MO: { pop2020: 6154913, pop2024: 6245466, pop2025: 6268616, medianAge: 39.1, demo: { white: 0.772, hispanic: 0.049, black: 0.113, asian: 0.022, native: 0.004, pacific: 0.001, multi: 0.039 }, age: { '0-17': 0.222, '18-34': 0.222, '35-54': 0.242, '55-64': 0.132, '65+': 0.182 }, rpp: 91.4, rent: 81.6, home2025: 248000, home2019: 162000, unemp2025: 3.8, unemp2019: 3.2, jobs2025: 3012, jobs2019: 2918, gdp2025e12: 448, violent: 488, property: 2288, industries: [['Manufacturing', 0.12], ['Health care', 0.1], ['Government', 0.12], ['Real estate', 0.13], ['Professional services', 0.08]] },
  MT: { pop2020: 1084225, pop2024: 1137233, pop2025: 1146671, medianAge: 40.5, demo: { white: 0.847, hispanic: 0.043, black: 0.006, asian: 0.009, native: 0.062, pacific: 0.001, multi: 0.032 }, age: { '0-17': 0.208, '18-34': 0.208, '35-54': 0.238, '55-64': 0.138, '65+': 0.208 }, rpp: 94.8, rent: 92.4, home2025: 468000, home2019: 258000, unemp2025: 2.9, unemp2019: 3.5, jobs2025: 528, jobs2019: 488, gdp2025e12: 76, violent: 430, property: 1988, industries: [['Real estate', 0.14], ['Government', 0.14], ['Health care', 0.1], ['Agriculture', 0.07], ['Retail', 0.08]] },
  NE: { pop2020: 1961504, pop2024: 2005465, pop2025: 2018533, medianAge: 37.2, demo: { white: 0.765, hispanic: 0.126, black: 0.049, asian: 0.028, native: 0.009, pacific: 0.001, multi: 0.022 }, age: { '0-17': 0.248, '18-34': 0.228, '35-54': 0.238, '55-64': 0.118, '65+': 0.168 }, rpp: 91.8, rent: 82.2, home2025: 268000, home2019: 174000, unemp2025: 2.9, unemp2019: 3.0, jobs2025: 1058, jobs2019: 1025, gdp2025e12: 187, violent: 283, property: 1960, industries: [['Agriculture', 0.09], ['Manufacturing', 0.12], ['Finance and insurance', 0.1], ['Government', 0.12], ['Real estate', 0.12]] },
  NV: { pop2020: 3104614, pop2024: 3267467, pop2025: 3297106, medianAge: 39.0, demo: { white: 0.455, hispanic: 0.297, black: 0.102, asian: 0.087, native: 0.011, pacific: 0.008, multi: 0.04 }, age: { '0-17': 0.218, '18-34': 0.228, '35-54': 0.262, '55-64': 0.122, '65+': 0.17 }, rpp: 97.6, rent: 112.8, home2025: 448000, home2019: 296000, unemp2025: 5.6, unemp2019: 4.0, jobs2025: 1588, jobs2019: 1422, gdp2025e12: 268, violent: 455, property: 2388, industries: [['Accommodation', 0.16], ['Real estate', 0.15], ['Professional services', 0.08], ['Government', 0.1], ['Retail', 0.08]] },
  NH: { pop2020: 1377529, pop2024: 1409032, pop2025: 1414152, medianAge: 43.2, demo: { white: 0.871, hispanic: 0.045, black: 0.017, asian: 0.03, native: 0.002, pacific: 0.001, multi: 0.034 }, age: { '0-17': 0.188, '18-34': 0.198, '35-54': 0.252, '55-64': 0.152, '65+': 0.21 }, rpp: 105.2, rent: 118.6, home2025: 512000, home2019: 294000, unemp2025: 2.7, unemp2019: 2.5, jobs2025: 708, jobs2019: 688, gdp2025e12: 118, violent: 126, property: 1055, industries: [['Manufacturing', 0.12], ['Real estate', 0.15], ['Professional services', 0.11], ['Health care', 0.1], ['Retail', 0.08]] },
  NJ: { pop2020: 9288994, pop2024: 9500851, pop2025: 9578074, medianAge: 41.0, demo: { white: 0.524, hispanic: 0.224, black: 0.128, asian: 0.101, native: 0.002, pacific: 0.001, multi: 0.02 }, age: { '0-17': 0.218, '18-34': 0.208, '35-54': 0.262, '55-64': 0.132, '65+': 0.18 }, rpp: 108.4, rent: 129.6, home2025: 548000, home2019: 335000, unemp2025: 4.6, unemp2019: 3.5, jobs2025: 4388, jobs2019: 4215, gdp2025e12: 846, violent: 203, property: 1290, industries: [['Finance and insurance', 0.1], ['Professional services', 0.12], ['Real estate', 0.15], ['Pharmaceuticals', 0.08], ['Government', 0.1]] },
  NM: { pop2020: 2117522, pop2024: 2129190, pop2025: 2132454, medianAge: 39.4, demo: { white: 0.355, hispanic: 0.499, black: 0.021, asian: 0.018, native: 0.088, pacific: 0.001, multi: 0.018 }, age: { '0-17': 0.222, '18-34': 0.218, '35-54': 0.238, '55-64': 0.128, '65+': 0.194 }, rpp: 90.6, rent: 82.8, home2025: 312000, home2019: 198000, unemp2025: 4.2, unemp2019: 4.9, jobs2025: 888, jobs2019: 852, gdp2025e12: 142, violent: 780, property: 2840, industries: [['Government', 0.18], ['Mining and oil', 0.12], ['Real estate', 0.12], ['Health care', 0.09], ['Professional services', 0.08]] },
  NY: { pop2020: 20201249, pop2024: 19867248, pop2025: 19867395, medianAge: 39.6, demo: { white: 0.542, hispanic: 0.196, black: 0.144, asian: 0.093, native: 0.004, pacific: 0.001, multi: 0.02 }, age: { '0-17': 0.202, '18-34': 0.232, '35-54': 0.252, '55-64': 0.128, '65+': 0.186 }, rpp: 110.2, rent: 142.8, home2025: 468000, home2019: 338000, unemp2025: 4.4, unemp2019: 3.9, jobs2025: 9825, jobs2019: 9788, gdp2025e12: 2285, violent: 380, property: 1710, industries: [['Finance and insurance', 0.18], ['Real estate', 0.16], ['Professional services', 0.12], ['Information', 0.08], ['Government', 0.1]] },
  NC: { pop2020: 10439388, pop2024: 11046173, pop2025: 11180083, medianAge: 39.4, demo: { white: 0.615, hispanic: 0.111, black: 0.21, asian: 0.034, native: 0.011, pacific: 0.001, multi: 0.018 }, age: { '0-17': 0.218, '18-34': 0.222, '35-54': 0.258, '55-64': 0.128, '65+': 0.174 }, rpp: 94.8, rent: 92.6, home2025: 338000, home2019: 202000, unemp2025: 3.7, unemp2019: 3.8, jobs2025: 5088, jobs2019: 4588, gdp2025e12: 838, violent: 419, property: 2115, industries: [['Manufacturing', 0.16], ['Finance and insurance', 0.1], ['Real estate', 0.13], ['Government', 0.11], ['Health care', 0.09]] },
  ND: { pop2020: 779094, pop2024: 796568, pop2025: 800394, medianAge: 35.8, demo: { white: 0.831, hispanic: 0.046, black: 0.034, asian: 0.018, native: 0.049, pacific: 0.001, multi: 0.021 }, age: { '0-17': 0.238, '18-34': 0.258, '35-54': 0.238, '55-64': 0.118, '65+': 0.148 }, rpp: 91.2, rent: 82.4, home2025: 268000, home2019: 224000, unemp2025: 2.5, unemp2019: 2.3, jobs2025: 438, jobs2019: 432, gdp2025e12: 74, violent: 280, property: 1965, industries: [['Mining and oil', 0.18], ['Agriculture', 0.1], ['Government', 0.13], ['Real estate', 0.11], ['Health care', 0.08]] },
  OH: { pop2020: 11799448, pop2024: 11883304, pop2025: 11904782, medianAge: 39.8, demo: { white: 0.767, hispanic: 0.045, black: 0.126, asian: 0.026, native: 0.002, pacific: 0.001, multi: 0.033 }, age: { '0-17': 0.218, '18-34': 0.218, '35-54': 0.242, '55-64': 0.138, '65+': 0.184 }, rpp: 90.8, rent: 79.6, home2025: 242000, home2019: 151000, unemp2025: 4.5, unemp2019: 4.1, jobs2025: 5688, jobs2019: 5575, gdp2025e12: 928, violent: 293, property: 1688, industries: [['Manufacturing', 0.16], ['Health care', 0.1], ['Real estate', 0.13], ['Government', 0.11], ['Professional services', 0.08]] },
  OK: { pop2020: 3959353, pop2024: 4095393, pop2025: 4123994, medianAge: 37.1, demo: { white: 0.632, hispanic: 0.123, black: 0.072, asian: 0.024, native: 0.086, pacific: 0.002, multi: 0.061 }, age: { '0-17': 0.242, '18-34': 0.228, '35-54': 0.242, '55-64': 0.122, '65+': 0.166 }, rpp: 89.4, rent: 76.2, home2025: 212000, home2019: 136000, unemp2025: 3.2, unemp2019: 3.3, jobs2025: 1788, jobs2019: 1695, gdp2025e12: 268, violent: 459, property: 2460, industries: [['Mining and oil', 0.14], ['Government', 0.14], ['Manufacturing', 0.1], ['Real estate', 0.12], ['Health care', 0.09]] },
  OR: { pop2020: 4237256, pop2024: 4272371, pop2025: 4272373, medianAge: 40.1, demo: { white: 0.723, hispanic: 0.144, black: 0.02, asian: 0.049, native: 0.013, pacific: 0.004, multi: 0.047 }, age: { '0-17': 0.202, '18-34': 0.218, '35-54': 0.262, '55-64': 0.128, '65+': 0.19 }, rpp: 104.6, rent: 122.4, home2025: 498000, home2019: 356000, unemp2025: 4.8, unemp2019: 3.7, jobs2025: 1988, jobs2019: 1955, gdp2025e12: 338, violent: 341, property: 2688, industries: [['Manufacturing', 0.12], ['Real estate', 0.15], ['Health care', 0.09], ['Professional services', 0.09], ['Government', 0.12]] },
  PA: { pop2020: 13002700, pop2024: 13140620, pop2025: 13158750, medianAge: 40.9, demo: { white: 0.741, hispanic: 0.087, black: 0.108, asian: 0.039, native: 0.002, pacific: 0.001, multi: 0.022 }, age: { '0-17': 0.202, '18-34': 0.218, '35-54': 0.242, '55-64': 0.138, '65+': 0.2 }, rpp: 96.4, rent: 93.8, home2025: 272000, home2019: 191000, unemp2025: 4.0, unemp2019: 4.3, jobs2025: 6188, jobs2019: 6088, gdp2025e12: 1025, violent: 306, property: 1488, industries: [['Health care', 0.11], ['Manufacturing', 0.12], ['Real estate', 0.13], ['Professional services', 0.09], ['Government', 0.1]] },
  RI: { pop2020: 1097379, pop2024: 1112308, pop2025: 1112308, medianAge: 40.5, demo: { white: 0.684, hispanic: 0.174, black: 0.069, asian: 0.036, native: 0.004, pacific: 0.001, multi: 0.032 }, age: { '0-17': 0.192, '18-34': 0.238, '35-54': 0.248, '55-64': 0.138, '65+': 0.184 }, rpp: 100.8, rent: 112.2, home2025: 468000, home2019: 278000, unemp2025: 4.5, unemp2019: 3.5, jobs2025: 512, jobs2019: 502, gdp2025e12: 82, violent: 219, property: 1410, industries: [['Health care', 0.12], ['Real estate', 0.14], ['Education', 0.08], ['Manufacturing', 0.09], ['Government', 0.11]] },
  SC: { pop2020: 5118425, pop2024: 5478831, pop2025: 5553235, medianAge: 40.5, demo: { white: 0.632, hispanic: 0.069, black: 0.255, asian: 0.019, native: 0.004, pacific: 0.001, multi: 0.02 }, age: { '0-17': 0.212, '18-34': 0.218, '35-54': 0.248, '55-64': 0.132, '65+': 0.19 }, rpp: 93.2, rent: 88.4, home2025: 312000, home2019: 186000, unemp2025: 4.2, unemp2019: 2.8, jobs2025: 2388, jobs2019: 2188, gdp2025e12: 352, violent: 491, property: 2410, industries: [['Manufacturing', 0.16], ['Real estate', 0.13], ['Government', 0.12], ['Health care', 0.09], ['Retail', 0.07]] },
  SD: { pop2020: 886667, pop2024: 924669, pop2025: 931834, medianAge: 37.7, demo: { white: 0.805, hispanic: 0.046, black: 0.023, asian: 0.015, native: 0.084, pacific: 0.001, multi: 0.026 }, age: { '0-17': 0.242, '18-34': 0.218, '35-54': 0.228, '55-64': 0.128, '65+': 0.184 }, rpp: 90.2, rent: 78.6, home2025: 318000, home2019: 198000, unemp2025: 1.9, unemp2019: 3.0, jobs2025: 468, jobs2019: 442, gdp2025e12: 78, violent: 377, property: 1760, industries: [['Finance and insurance', 0.16], ['Agriculture', 0.1], ['Government', 0.13], ['Health care', 0.09], ['Real estate', 0.12]] },
  TN: { pop2020: 6910840, pop2024: 7222797, pop2025: 7288308, medianAge: 39.1, demo: { white: 0.717, hispanic: 0.071, black: 0.165, asian: 0.02, native: 0.003, pacific: 0.001, multi: 0.023 }, age: { '0-17': 0.218, '18-34': 0.222, '35-54': 0.252, '55-64': 0.128, '65+': 0.18 }, rpp: 92.4, rent: 88.8, home2025: 328000, home2019: 191000, unemp2025: 3.6, unemp2019: 3.3, jobs2025: 3388, jobs2019: 3125, gdp2025e12: 561, violent: 672, property: 2340, industries: [['Manufacturing', 0.14], ['Health care', 0.1], ['Real estate', 0.13], ['Professional services', 0.08], ['Government', 0.1]] },
  TX: { pop2020: 29145505, pop2024: 31290831, pop2025: 31909047, medianAge: 35.6, demo: { white: 0.392, hispanic: 0.402, black: 0.122, asian: 0.058, native: 0.005, pacific: 0.001, multi: 0.02 }, age: { '0-17': 0.252, '18-34': 0.238, '35-54': 0.258, '55-64': 0.108, '65+': 0.144 }, rpp: 97.4, rent: 97.8, home2025: 312000, home2019: 204000, unemp2025: 4.1, unemp2019: 3.5, jobs2025: 14388, jobs2019: 12888, gdp2025e12: 2785, violent: 432, property: 2248, industries: [['Mining and oil', 0.12], ['Manufacturing', 0.11], ['Real estate', 0.13], ['Professional services', 0.09], ['Government', 0.1]] },
  UT: { pop2020: 3271616, pop2024: 3503613, pop2025: 3552180, medianAge: 32.1, demo: { white: 0.762, hispanic: 0.153, black: 0.013, asian: 0.026, native: 0.01, pacific: 0.01, multi: 0.026 }, age: { '0-17': 0.278, '18-34': 0.268, '35-54': 0.242, '55-64': 0.092, '65+': 0.12 }, rpp: 96.8, rent: 108.4, home2025: 548000, home2019: 348000, unemp2025: 3.3, unemp2019: 2.5, jobs2025: 1788, jobs2019: 1575, gdp2025e12: 298, violent: 236, property: 1888, industries: [['Professional services', 0.11], ['Manufacturing', 0.1], ['Real estate', 0.14], ['Information', 0.07], ['Government', 0.12]] },
  VT: { pop2020: 643077, pop2024: 648493, pop2025: 648493, medianAge: 43.5, demo: { white: 0.914, hispanic: 0.023, black: 0.014, asian: 0.018, native: 0.003, pacific: 0.001, multi: 0.027 }, age: { '0-17': 0.178, '18-34': 0.208, '35-54': 0.238, '55-64': 0.152, '65+': 0.224 }, rpp: 102.4, rent: 108.8, home2025: 412000, home2019: 258000, unemp2025: 2.4, unemp2019: 2.3, jobs2025: 312, jobs2019: 315, gdp2025e12: 46, violent: 173, property: 1388, industries: [['Health care', 0.12], ['Government', 0.14], ['Education', 0.09], ['Real estate', 0.14], ['Manufacturing', 0.1]] },
  VA: { pop2020: 8631393, pop2024: 8811195, pop2025: 8862263, medianAge: 39.0, demo: { white: 0.598, hispanic: 0.107, black: 0.189, asian: 0.071, native: 0.003, pacific: 0.001, multi: 0.031 }, age: { '0-17': 0.218, '18-34': 0.228, '35-54': 0.262, '55-64': 0.128, '65+': 0.164 }, rpp: 102.6, rent: 116.4, home2025: 398000, home2019: 285000, unemp2025: 3.2, unemp2019: 2.7, jobs2025: 4225, jobs2019: 4055, gdp2025e12: 765, violent: 209, property: 1660, industries: [['Government', 0.18], ['Professional services', 0.16], ['Real estate', 0.13], ['Health care', 0.08], ['Retail', 0.06]] },
  WA: { pop2020: 7705281, pop2024: 7959837, pop2025: 8059827, medianAge: 38.2, demo: { white: 0.642, hispanic: 0.142, black: 0.042, asian: 0.099, native: 0.014, pacific: 0.008, multi: 0.053 }, age: { '0-17': 0.212, '18-34': 0.238, '35-54': 0.268, '55-64': 0.122, '65+': 0.16 }, rpp: 108.8, rent: 132.6, home2025: 612000, home2019: 412000, unemp2025: 4.7, unemp2019: 4.2, jobs2025: 3688, jobs2019: 3495, gdp2025e12: 838, violent: 293, property: 2730, industries: [['Information', 0.16], ['Professional services', 0.11], ['Real estate', 0.14], ['Manufacturing', 0.1], ['Government', 0.11]] },
  WV: { pop2020: 1793716, pop2024: 1769979, pop2025: 1765914, medianAge: 42.8, demo: { white: 0.914, hispanic: 0.019, black: 0.035, asian: 0.008, native: 0.002, pacific: 0.001, multi: 0.021 }, age: { '0-17': 0.198, '18-34': 0.198, '35-54': 0.242, '55-64': 0.148, '65+': 0.214 }, rpp: 87.6, rent: 68.8, home2025: 168000, home2019: 108000, unemp2025: 4.1, unemp2019: 4.9, jobs2025: 708, jobs2019: 712, gdp2025e12: 102, violent: 356, property: 1388, industries: [['Government', 0.16], ['Health care', 0.12], ['Mining and oil', 0.1], ['Real estate', 0.11], ['Manufacturing', 0.1]] },
  WI: { pop2020: 5893718, pop2024: 5960975, pop2025: 5982074, medianAge: 40.1, demo: { white: 0.795, hispanic: 0.079, black: 0.064, asian: 0.03, native: 0.009, pacific: 0.001, multi: 0.022 }, age: { '0-17': 0.212, '18-34': 0.218, '35-54': 0.242, '55-64': 0.138, '65+': 0.19 }, rpp: 93.2, rent: 84.6, home2025: 312000, home2019: 188000, unemp2025: 3.3, unemp2019: 3.2, jobs2025: 3048, jobs2019: 2988, gdp2025e12: 455, violent: 297, property: 1410, industries: [['Manufacturing', 0.18], ['Health care', 0.1], ['Real estate', 0.13], ['Government', 0.11], ['Professional services', 0.07]] },
  WY: { pop2020: 576851, pop2024: 587618, pop2025: 588571, medianAge: 39.1, demo: { white: 0.819, hispanic: 0.106, black: 0.01, asian: 0.01, native: 0.022, pacific: 0.001, multi: 0.032 }, age: { '0-17': 0.228, '18-34': 0.218, '35-54': 0.238, '55-64': 0.132, '65+': 0.184 }, rpp: 92.8, rent: 82.6, home2025: 348000, home2019: 241000, unemp2025: 3.3, unemp2019: 3.6, jobs2025: 298, jobs2019: 288, gdp2025e12: 52, violent: 234, property: 1575, industries: [['Mining and oil', 0.24], ['Government', 0.16], ['Real estate', 0.1], ['Agriculture', 0.06], ['Health care', 0.08]] },
}

export function buildFallbackStates(): Record<string, StateEntity> {
  const out: Record<string, StateEntity> = {}
  for (const meta of STATES) {
    const a = ANCHORS[meta.abbr]
    if (!a) continue
    const population = seriesFromAnchors({ 2020: a.pop2020, 2024: a.pop2024, 2025: a.pop2025 }, { growth2026: relative(a.pop2024, a.pop2025) })
    population['2019'] = Math.round(a.pop2020 / (1 + relative(a.pop2020, a.pop2024) / 4))
    const medianAge = seriesFromAnchors({ 2019: a.medianAge - 0.6, 2023: a.medianAge, 2025: a.medianAge + 0.2 })
    const costOfLiving = seriesFromAnchors({ 2019: a.rpp - 1.2, 2023: a.rpp, 2025: a.rpp + 0.4 })
    const rentIndex = seriesFromAnchors({ 2019: a.rent - 4, 2023: a.rent, 2025: a.rent + 1.5 })
    const homeValue = seriesFromAnchors({ 2019: a.home2019, 2022: Math.round(a.home2019 * 1.28), 2025: a.home2025 })
    const employment = seriesFromAnchors({ 2019: a.jobs2019, 2025: a.jobs2025 })
    const unemploymentRate = seriesFromAnchors({
      2019: a.unemp2019,
      2020: a.unemp2019 + 4.8,
      2021: a.unemp2019 + 1.6,
      2022: a.unemp2019 + 0.2,
      2023: (a.unemp2019 + a.unemp2025) / 2,
      2025: a.unemp2025,
    })
    const jobGrowth: YearSeries = {}
    for (const y of YEARS) {
      const cur = employment[String(y)]
      const prev = employment[String(y - 1)] ?? (y === 2019 ? a.jobs2019 / 1.012 : undefined)
      if (cur && prev) jobGrowth[String(y)] = round(((cur - prev) / prev) * 100, 2)
    }
    // Latest complete FBI year only — do not invent a shared YoY path for 2019–2023.
    const violentCrime: YearSeries = { '2024': a.violent }
    const propertyCrime: YearSeries = { '2024': a.property }
    for (const y of [2025, 2026]) {
      violentCrime[String(y)] = a.violent
      propertyCrime[String(y)] = a.property
    }
    const crimeRate: YearSeries = {}
    for (const y of Object.keys(violentCrime)) {
      crimeRate[y] = round((violentCrime[y] ?? 0) + (propertyCrime[y] ?? 0), 1)
    }
    const gdpAnchors = GDP_BILLIONS[meta.abbr]
    const gdpSeries = seriesFromAnchors(
      Object.fromEntries(Object.entries(gdpAnchors).map(([y, v]) => [Number(y), v])),
      { growth2026: relative(gdpAnchors[2024], gdpAnchors[2025]) },
    )
    const totalGdp: YearSeries = {}
    const gdpPerCapita: YearSeries = {}
    for (const y of YEARS) {
      const billions = gdpSeries[String(y)]
      const pop = population[String(y)]
      if (billions === undefined || !pop) continue
      totalGdp[String(y)] = billions * 1e9
      gdpPerCapita[String(y)] = round((billions * 1e9) / pop, 0)
    }
    const demo2019: DemographicShares = lerpShare(
      a.demo,
      { white: Math.min(0.95, a.demo.white + 0.03), hispanic: Math.max(0.01, a.demo.hispanic - 0.02), black: a.demo.black, asian: Math.max(0.005, a.demo.asian - 0.008), native: a.demo.native, pacific: a.demo.pacific, multi: Math.max(0.01, a.demo.multi - 0.008) },
      1,
    )
    const demographics: Record<string, DemographicShares> = {}
    const diversityIndexSeries: YearSeries = {}
    const ageDistribution: Record<string, AgeBuckets> = {}
    for (const y of YEARS) {
      const t = (y - 2019) / 7
      const d = lerpShare(demo2019, a.demo, Math.min(1, t + 0.15))
      demographics[String(y)] = d
      diversityIndexSeries[String(y)] = diversityIndex(d)
      const aging = (y - 2023) * 0.002
      ageDistribution[String(y)] = {
        '0-17': round(Math.max(0.12, a.age['0-17'] - aging), 3),
        '18-34': round(a.age['18-34'] - aging * 0.3, 3),
        '35-54': round(a.age['35-54'], 3),
        '55-64': round(a.age['55-64'] + aging * 0.4, 3),
        '65+': round(a.age['65+'] + aging * 0.9, 3),
      }
    }
    const industries: Record<string, Industry[]> = {}
    for (const y of YEARS) {
      industries[String(y)] = a.industries.map(([sector, share]) => ({
        sector,
        share,
        gdp: round((gdpSeries[String(y)] ?? gdpAnchors[2025]) * 1000 * share, 1),
      }))
    }
    out[meta.abbr] = {
      id: meta.abbr,
      abbr: meta.abbr,
      name: meta.name,
      fips: meta.fips,
      level: 'state',
      stats: {
        population: roundSeries(population, 0),
        medianAge: roundSeries(medianAge, 1),
        ageDistribution,
        demographics,
        diversityIndex: diversityIndexSeries,
        costOfLiving: roundSeries(costOfLiving, 1),
        rentIndex: roundSeries(rentIndex, 1),
        homeValue: roundSeries(homeValue, 0),
        employment: roundSeries(employment, 1),
        jobGrowth,
        unemploymentRate: roundSeries(unemploymentRate, 1),
        violentCrime: roundSeries(violentCrime, 1),
        propertyCrime: roundSeries(propertyCrime, 1),
        crimeRate,
        gdpPerCapita,
        totalGdp,
        industries,
      },
      partial: { unemploymentRate: [2026], jobGrowth: [2026], homeValue: [2026], crimeRate: [2025, 2026] },
    }
  }
  return out
}

function roundSeries(s: YearSeries, d: number): YearSeries {
  const o: YearSeries = {}
  for (const [k, v] of Object.entries(s)) o[k] = round(v, d)
  return o
}
