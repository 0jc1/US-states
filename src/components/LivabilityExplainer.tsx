import { PILLAR_DEFS, PILLAR_WEIGHTS, type PillarId } from '@/lib/score'
import type { Layer } from '@/lib/url-state'

const BAR_OPACITY: Record<PillarId, string> = {
  prosperity: 'bg-foreground',
  affordability: 'bg-foreground/75',
  opportunity: 'bg-foreground/55',
  safety: 'bg-foreground/38',
  momentum: 'bg-foreground/22',
}

const STEPS = [
  { n: '1', title: 'Take the raw stats', body: 'GDP, prices, jobs, housing, crime, population' },
  { n: '2', title: 'Rank vs peers', body: 'Turn each into a 0–100 percentile. Lower crime and prices score higher.' },
  { n: '3', title: 'Mix the five pillars', body: 'Weighted average. Missing pillars are dropped and the rest are renormalized.' },
] as const

export function LivabilityExplainer({ layer }: { layer: Layer }) {
  const peers = layer === 'cities' ? 'large cities' : 'states'
  return (
    <div className="space-y-3">
      <div>
        <div className="font-heading text-sm font-medium">How livability is scored</div>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
          A move-value score vs other {peers} this year — not size or prestige.
        </p>
      </div>

      <ol className="space-y-1.5">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-2">
            <span className="mt-px flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
              {s.n}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-medium leading-4">{s.title}</div>
              <div className="text-[11px] leading-snug text-muted-foreground">{s.body}</div>
            </div>
          </li>
        ))}
      </ol>

      <div>
        <div className="mb-1 flex h-2.5 overflow-hidden rounded-full">
          {PILLAR_DEFS.map((p) => (
            <div
              key={p.id}
              className={BAR_OPACITY[p.id]}
              style={{ width: `${PILLAR_WEIGHTS[p.id] * 100}%` }}
              title={`${p.label} ${Math.round(PILLAR_WEIGHTS[p.id] * 100)}%`}
            />
          ))}
        </div>
        <ul className="space-y-1">
          {PILLAR_DEFS.map((p) => (
            <li key={p.id} className="flex items-baseline gap-2 text-[11px] leading-snug">
              <span className={`mt-1 size-1.5 shrink-0 rounded-full ${BAR_OPACITY[p.id]}`} />
              <span className="w-8 shrink-0 tabular-nums text-muted-foreground">
                {Math.round(PILLAR_WEIGHTS[p.id] * 100)}%
              </span>
              <span className="min-w-0">
                <span className="font-medium text-foreground">{p.label}</span>
                <span className="text-muted-foreground"> · {p.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
