import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { AGE_BUCKETS, type Entity } from '@/lib/types'

const config = {
  share: { label: 'Share', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function AgeChart({ entity, year }: { entity: Entity; year: number }) {
  const buckets = entity.stats.ageDistribution?.[String(year)]
  if (!buckets) return null
  const data = AGE_BUCKETS.map((b) => ({ bucket: b, share: Math.round(buckets[b] * 1000) / 10 }))
  return (
    <ChartContainer config={config} className="aspect-[2/1] w-full">
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <XAxis dataKey="bucket" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis hide />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="share" fill="var(--color-share)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
