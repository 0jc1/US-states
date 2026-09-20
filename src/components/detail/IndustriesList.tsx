import { formatShare } from '@/lib/format'
import type { Entity } from '@/lib/types'

export function IndustriesList({ entity, year }: { entity: Entity; year: number }) {
  const industries =
    entity.stats.industries?.[String(year)] ??
    entity.stats.industries?.[String(year - 1)] ??
    entity.stats.industries?.['2024']
  if (!industries?.length) return null
  return (
    <ul className="space-y-2">
      {industries.map((ind) => (
        <li key={ind.sector}>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">{ind.sector}</span>
            <span className="tabular-nums text-muted-foreground">{formatShare(ind.share)}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-chart-1" style={{ width: `${Math.min(100, ind.share * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
