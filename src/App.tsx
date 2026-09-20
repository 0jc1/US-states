import { StatSelector } from '@/components/controls/StatSelector'
import { YearControl } from '@/components/controls/YearControl'
import { ModeToggles } from '@/components/controls/ModeToggles'
import { UsMap } from '@/components/map/UsMap'
import { DetailSheet } from '@/components/detail/DetailSheet'
import { RankingList } from '@/components/RankingList'
import { entityById } from '@/lib/data'
import { STAT_BY_ID, STAT_DEFS } from '@/lib/stats'
import { useAppView } from '@/lib/url-state'

export default function App() {
  const { view, setView } = useAppView()
  const raw = STAT_BY_ID[view.stat] ?? STAT_DEFS[0]
  const def =
    view.layer === 'cities' && !raw.levels.includes('city')
      ? STAT_BY_ID.population
      : raw
  const selected = entityById(view.selected)

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="border-b px-4 py-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="font-heading text-lg font-medium tracking-tight">US State Finder</h1>
            <p className="text-sm text-muted-foreground">
              Compare states and major cities for a 2026 move — livability, cost, jobs, crime, and the economy.
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
          <StatSelector
            value={def.id}
            layer={view.layer}
            onChange={(stat) => setView({ stat })}
          />
          <YearControl year={view.year} onChange={(year) => setView({ year })} />
          <ModeToggles
            mode={view.mode}
            layer={view.layer}
            onMode={(mode) => setView({ mode })}
            onLayer={(layer) => setView({ layer })}
          />
        </div>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
        <UsMap
          def={def}
          year={view.year}
          mode={view.mode}
          layer={view.layer}
          selectedId={view.selected}
          onSelect={(id) => setView({ selected: id })}
        />
        <RankingList
          def={def}
          year={view.year}
          layer={view.layer}
          selectedId={view.selected}
          onSelect={(id) => setView({ selected: id })}
        />
      </div>
      <DetailSheet
        entity={selected}
        year={view.year}
        activeStat={def.id}
        onOpenChange={(open) => {
          if (!open) setView({ selected: null })
        }}
        onStat={(stat) => setView({ stat })}
      />
    </div>
  )
}
