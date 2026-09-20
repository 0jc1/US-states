import type { StatFormat } from './stats'

const intFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const compactFmt = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const usdFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const usdCompactFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const oneDec = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })

export function formatValue(value: number | undefined | null, format: StatFormat): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '—'
  switch (format) {
    case 'int':
      return intFmt.format(value)
    case 'compact':
      return compactFmt.format(value)
    case 'usd':
      return usdFmt.format(value)
    case 'usdCompact':
      // totals are stored in millions for GDP; callers pass dollars
      return usdCompactFmt.format(value)
    case 'pct':
      return `${oneDec.format(value)}%`
    case 'index':
      return oneDec.format(value)
    case 'per100k':
      return intFmt.format(value)
    case 'years':
      return `${oneDec.format(value)} yrs`
  }
}

export function formatPct(value: number | undefined | null, opts: { sign?: boolean; digits?: number } = {}): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '—'
  const digits = opts.digits ?? 1
  const s = value.toFixed(digits)
  const sign = opts.sign !== false && value > 0 ? '+' : ''
  return `${sign}${s}%`
}

export function formatShare(share: number | undefined): string {
  if (share === undefined || !Number.isFinite(share)) return '—'
  return `${(share * 100).toFixed(1)}%`
}
