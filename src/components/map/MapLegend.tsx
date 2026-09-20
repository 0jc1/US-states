import { formatValue, formatPct } from '@/lib/format'
import type { StatDef } from '@/lib/stats'
import type { ColorScale } from '@/lib/colors'
import { NO_DATA_LEGEND } from '@/lib/colors'
import type { ColorMode } from '@/lib/url-state'

export function MapLegend({
  scale,
  def,
  mode,
  vintage,
}: {
  scale: ColorScale | undefined
  def: StatDef
  mode: ColorMode
  vintage?: string
}) {
  if (!scale) return null
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 max-w-sm rounded-lg bg-background/90 p-3 text-xs shadow-sm ring-1 ring-foreground/10 backdrop-blur">
      <div className="mb-1.5 font-medium">
        {mode === 'change' ? `YoY change · ${def.shortLabel}` : def.shortLabel}
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full">
        {scale.legend.map((b, i) => (
          <div key={i} className="flex-1" style={{ background: b.color }} />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground tabular-nums">
        <span>
          {mode === 'change' ? formatPct(scale.domain[0]) : formatValue(scale.domain[0], def.format)}
        </span>
        <span>
          {mode === 'change' ? formatPct(scale.domain[1]) : formatValue(scale.domain[1], def.format)}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="inline-block size-2.5 rounded-sm" style={{ background: NO_DATA_LEGEND }} />
        No data
        {vintage ? <span>· {vintage}</span> : null}
      </div>
    </div>
  )
}
