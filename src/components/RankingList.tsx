import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { CITIES, STATE_LIST } from '@/lib/data'
import { formatPct, formatValue } from '@/lib/format'
import { getValue, type StatDef } from '@/lib/stats'
import { fireThreshold, isFire, trendTone, yoy } from '@/lib/trends'
import type { Layer } from '@/lib/url-state'
import { cn } from '@/lib/utils'

export function RankingList({
  def,
  year,
  layer,
  selectedId,
  onSelect,
}: {
  def: StatDef
  year: number
  layer: Layer
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const entities = layer === 'cities' ? CITIES : STATE_LIST
  const threshold = fireThreshold(entities, def, year)
  const rows = [...entities]
    .map((e) => ({
      entity: e,
      value: getValue(e.stats, def, year),
      trend: yoy(e, def, year),
    }))
    .sort((a, b) => {
      const fallback = def.direction === 'lowerIsBetter' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY
      const av = a.value ?? fallback
      const bv = b.value ?? fallback
      return def.direction === 'lowerIsBetter' ? av - bv : bv - av
    })

  return (
    <div className="flex h-full min-h-0 flex-col border-l bg-background">
      <div className="border-b px-3 py-2">
        <div className="font-heading text-sm font-medium">Ranking</div>
        <div className="text-xs text-muted-foreground">
          {layer === 'cities' ? '50 largest cities' : 'States'} · {def.shortLabel} · {year}
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <ol className="divide-y">
          {rows.map((row, i) => {
            const fire = isFire(def, row.trend, threshold)
            const tone = row.trend ? trendTone(def, row.trend.pct) : 'neutral'
            const toneClass =
              tone === 'good' ? 'text-emerald-600' : tone === 'bad' ? 'text-rose-600' : 'text-muted-foreground'
            const id = row.entity.id
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onSelect(id)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60',
                    selectedId === id && 'bg-muted',
                  )}
                >
                  <span className="w-6 shrink-0 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {row.entity.name}
                    {row.entity.level === 'city' ? (
                      <span className="text-muted-foreground"> {row.entity.state}</span>
                    ) : null}
                  </span>
                  <span className="tabular-nums">{formatValue(row.value, def.format)}</span>
                  <span className={`w-14 text-right text-xs tabular-nums ${toneClass}`}>
                    {fire ? '🔥' : ''} {formatPct(row.trend?.pct)}
                  </span>
                  {row.entity.partial?.[def.id]?.includes(year) ? (
                    <Badge variant="outline">YTD</Badge>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ol>
      </ScrollArea>
    </div>
  )
}
