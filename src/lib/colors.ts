import { extent, quantile } from 'd3-array'
import { scaleDiverging, scaleQuantile, type ScaleDiverging, type ScaleQuantile } from 'd3-scale'
import {
  interpolateBlues,
  interpolateGreens,
  interpolateOranges,
  interpolatePuOr,
  interpolatePurples,
  interpolateRdBu,
  interpolateReds,
  interpolateYlGnBu,
} from 'd3-scale-chromatic'
import type { StatDef } from './stats'

export const NO_DATA_FILL = 'url(#no-data-hatch)'
export const NO_DATA_LEGEND = '#d4d4d4'

const PALETTES: Record<StatDef['palette'], (t: number) => string> = {
  reds: interpolateReds,
  blues: interpolateBlues,
  greens: interpolateGreens,
  purples: interpolatePurples,
  oranges: interpolateOranges,
  teal: interpolateYlGnBu,
}

const STEPS = 7

/** Clamp the interpolator so the lightest bin is still visible on white. */
function ramp(interp: (t: number) => string) {
  return Array.from({ length: STEPS }, (_, i) => interp(0.15 + (0.8 * i) / (STEPS - 1)))
}

export interface ColorScale {
  color: (v: number | undefined) => string
  /** legend swatches from low to high */
  legend: { color: string; from: number; to: number }[]
  domain: [number, number]
  mode: 'value' | 'change'
}

export function makeValueScale(values: number[], def: StatDef): ColorScale | undefined {
  const clean = values.filter((v) => Number.isFinite(v))
  if (clean.length < 2) return undefined
  const range = ramp(PALETTES[def.palette])
  const scale: ScaleQuantile<string> = scaleQuantile<string>().domain(clean).range(range)
  const [lo, hi] = extent(clean) as [number, number]
  const thresholds = scale.quantiles()
  const legend = range.map((color, i) => ({
    color,
    from: i === 0 ? lo : thresholds[i - 1],
    to: i === range.length - 1 ? hi : thresholds[i],
  }))
  return {
    color: (v) => (v === undefined || !Number.isFinite(v) ? NO_DATA_FILL : scale(v)),
    legend,
    domain: [lo, hi],
    mode: 'value',
  }
}

/**
 * Diverging scale for YoY % change centered on 0. The favorable direction is
 * always rendered blue/green-ish and the unfavorable direction red/orange.
 */
export function makeChangeScale(pcts: number[], def: StatDef): ColorScale | undefined {
  const clean = pcts.filter((v) => Number.isFinite(v))
  if (clean.length < 2) return undefined
  // robust bound: 95th percentile of |change| so one outlier doesn't flatten the map
  const abs = clean.map(Math.abs).sort((a, b) => a - b)
  const bound = Math.max(quantile(abs, 0.95) ?? 1, 0.1)
  const interp = def.direction === 'neutral' ? interpolatePuOr : interpolateRdBu
  // RdBu: 0 = red, 1 = blue. For lowerIsBetter flip so negative (good) is blue.
  const flip = def.direction === 'lowerIsBetter'
  const scale: ScaleDiverging<string> = scaleDiverging<string>()
    .domain(flip ? [bound, 0, -bound] : [-bound, 0, bound])
    .interpolator(interp)
    .clamp(true)
  const legend = Array.from({ length: STEPS }, (_, i) => {
    const from = -bound + (2 * bound * i) / STEPS
    const to = -bound + (2 * bound * (i + 1)) / STEPS
    return { color: scale((from + to) / 2), from, to }
  })
  return {
    color: (v) => (v === undefined || !Number.isFinite(v) ? NO_DATA_FILL : scale(v)),
    legend,
    domain: [-bound, bound],
    mode: 'change',
  }
}
