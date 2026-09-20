import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { DEMO_GROUPS, type Entity } from '@/lib/types'

const LABELS: Record<(typeof DEMO_GROUPS)[number], string> = {
  white: 'White',
  hispanic: 'Hispanic',
  black: 'Black',
  asian: 'Asian',
  native: 'Native',
  pacific: 'Pacific',
  multi: 'Multiracial',
}

const config = {
  share: { label: 'Share', color: 'var(--chart-3)' },
} satisfies ChartConfig

export function DemographicsChart({ entity, year }: { entity: Entity; year: number }) {
  const demo = entity.stats.demographics?.[String(year)]
  if (!demo) return null
  const data = DEMO_GROUPS.map((g) => ({
    group: LABELS[g],
    share: Math.round(demo[g] * 1000) / 10,
  }))
  return (
    <ChartContainer config={config} className="h-56 w-full aspect-auto">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="group" width={78} tickLine={false} axisLine={false} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="share" fill="var(--color-share)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
