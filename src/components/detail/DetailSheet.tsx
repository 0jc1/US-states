import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { STAT_BY_ID, STAT_DEFS, type StatId } from '@/lib/stats'
import { CITIES, STATE_LIST } from '@/lib/data'
import { trendWithFire } from '@/lib/trends'
import type { Entity } from '@/lib/types'
import { AgeChart } from './AgeChart'
import { DemographicsChart } from './DemographicsChart'
import { IndustriesList } from './IndustriesList'
import { PillarBreakdown } from './PillarBreakdown'
import { SourcesFooter } from './SourcesFooter'
import { StatCard } from './StatCard'
import { TrendChart } from './TrendChart'

export function DetailSheet({
  entity,
  year,
  activeStat,
  onOpenChange,
  onStat,
}: {
  entity: Entity | undefined
  year: number
  activeStat: StatId
  onOpenChange: (open: boolean) => void
  onStat: (id: StatId) => void
}) {
  const peers = entity?.level === 'city' ? CITIES : STATE_LIST
  const defs = STAT_DEFS.filter((s) => (entity ? s.levels.includes(entity.level) : true))
  return (
    <Sheet open={Boolean(entity)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg data-[side=right]:sm:max-w-lg">
        {entity ? (
          <>
            <SheetHeader>
              <SheetTitle>{entity.name}</SheetTitle>
              <SheetDescription>
                {entity.level === 'city' ? `${entity.state} · city` : 'State'} · {year}
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="min-h-0 flex-1 px-4 pb-6">
              <div className="grid grid-cols-2 gap-2">
                {defs.map((def) => {
                  const { trend, fire } = trendWithFire(peers, entity, def, year)
                  return (
                    <StatCard
                      key={def.id}
                      entity={entity}
                      def={def}
                      year={year}
                      trend={trend}
                      fire={fire}
                      partial={entity.partial?.[def.id]?.includes(year) ?? false}
                      active={def.id === activeStat}
                      onClick={() => onStat(def.id)}
                    />
                  )
                })}
              </div>
              <h3 className="mt-5 mb-2 font-heading text-sm font-medium">{STAT_BY_ID[activeStat].label} trend</h3>
              <TrendChart entity={entity} def={STAT_BY_ID[activeStat]} />
              {activeStat === 'livability' ? (
                <>
                  <h3 className="mt-5 mb-2 font-heading text-sm font-medium">Score breakdown</h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Percentile vs other {entity.level === 'city' ? 'large cities' : 'states'} this year (0 = worst
                    peer, 100 = best). Weighted 25% prosperity, 25% affordability, 20% opportunity, 20% safety, 10%
                    momentum.
                  </p>
                  <PillarBreakdown entity={entity} year={year} />
                </>
              ) : null}
              <h3 className="mt-5 mb-2 font-heading text-sm font-medium">Age distribution</h3>
              <AgeChart entity={entity} year={year} />
              <h3 className="mt-5 mb-2 font-heading text-sm font-medium">Demographics</h3>
              <DemographicsChart entity={entity} year={year} />
              <h3 className="mt-5 mb-2 font-heading text-sm font-medium">Major industries</h3>
              <IndustriesList entity={entity} year={year} />
              <Separator className="my-5" />
              <h3 className="mb-2 font-heading text-sm font-medium">Sources</h3>
              <SourcesFooter />
            </ScrollArea>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
