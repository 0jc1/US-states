import { Badge } from '@/components/ui/badge'
import { formatPct, formatValue } from '@/lib/format'
import type { StatDef } from '@/lib/stats'
import { trendTone } from '@/lib/trends'
import type { ColorMode } from '@/lib/url-state'

export interface TooltipInfo {
  x: number
  y: number
  name: string
  subtitle?: string
  value: number | undefined
  yoy: number | undefined
  fire: boolean
  partial: boolean
}

export function MapTooltip({
  info,
  def,
  mode,
}: {
  info: TooltipInfo | null
  def: StatDef
  mode: ColorMode
}) {
  if (!info) return null
  const tone = info.yoy !== undefined ? trendTone(def, info.yoy) : 'neutral'
  const toneClass =
    tone === 'good' ? 'text-emerald-600' : tone === 'bad' ? 'text-rose-600' : 'text-muted-foreground'
  return (
    <div
      className="pointer-events-none absolute z-20 w-56 rounded-lg bg-popover p-3 text-xs shadow-lg ring-1 ring-foreground/10"
      style={{ left: info.x + 14, top: info.y + 14 }}
    >
      <div className="font-heading text-sm font-medium">{info.name}</div>
      {info.subtitle ? <div className="text-muted-foreground">{info.subtitle}</div> : null}
      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <span className="text-lg font-medium tabular-nums">
          {mode === 'change' ? formatPct(info.yoy) : formatValue(info.value, def.format)}
        </span>
        <span className={`tabular-nums ${toneClass}`}>
          {info.fire ? '🔥 ' : ''}
          {formatPct(info.yoy)}
        </span>
      </div>
      {info.partial ? (
        <Badge variant="outline" className="mt-1">
          YTD
        </Badge>
      ) : null}
    </div>
  )
}
