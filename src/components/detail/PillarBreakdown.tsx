import { PILLAR_DEFS, pillarsFor, type PillarScores } from '@/lib/score'
import { CITIES, STATE_LIST } from '@/lib/data'
import type { Entity } from '@/lib/types'

function Bar({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-foreground/80" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function PillarBreakdown({ entity, year }: { entity: Entity; year: number }) {
  const peers = entity.level === 'city' ? CITIES : STATE_LIST
  const pillars: PillarScores | undefined = pillarsFor(peers, entity, year)
  if (!pillars) return null
  return (
    <ul className="space-y-2.5">
      {PILLAR_DEFS.map((p) => {
        const v = pillars[p.id]
        if (v === undefined) return null
        return (
          <li key={p.id}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span>{p.label}</span>
              <span className="tabular-nums text-muted-foreground">{v.toFixed(0)}</span>
            </div>
            <Bar value={v} />
            <div className="mt-0.5 text-[11px] text-muted-foreground">{p.detail}</div>
          </li>
        )
      })}
    </ul>
  )
}
