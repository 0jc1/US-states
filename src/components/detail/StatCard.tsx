import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatPct, formatValue } from '@/lib/format'
import { getValue, type StatDef } from '@/lib/stats'
import { trendTone, type Trend } from '@/lib/trends'
import type { Entity } from '@/lib/types'

export function StatCard({
  entity,
  def,
  year,
  trend,
  fire,
  partial,
  active,
  onClick,
}: {
  entity: Entity
  def: StatDef
  year: number
  trend: Trend | undefined
  fire: boolean
  partial: boolean
  active?: boolean
  onClick?: () => void
}) {
  const value = getValue(entity.stats, def, year)
  const tone = trend ? trendTone(def, trend.pct) : 'neutral'
  const toneClass =
    tone === 'good' ? 'text-emerald-600' : tone === 'bad' ? 'text-rose-600' : 'text-muted-foreground'
  return (
    <Card
      size="sm"
      className={active ? 'ring-2 ring-foreground/20' : 'cursor-pointer hover:bg-muted/40'}
      onClick={onClick}
    >
      <CardContent className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span>{def.shortLabel}</span>
          {partial ? <Badge variant="outline">YTD</Badge> : null}
        </div>
        <div className="font-heading text-xl font-medium tabular-nums">{formatValue(value, def.format)}</div>
        <div className={`text-xs tabular-nums ${toneClass}`}>
          {fire ? '🔥 ' : ''}
          {formatPct(trend?.pct)} vs {year - 1}
        </div>
      </CardContent>
    </Card>
  )
}
