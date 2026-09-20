import { Line, LineChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { getSeries, YEARS, type StatDef } from '@/lib/stats'
import { formatValue } from '@/lib/format'
import type { Entity } from '@/lib/types'

const config = {
  value: { label: 'Value', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function TrendChart({ entity, def }: { entity: Entity; def: StatDef }) {
  const series = getSeries(entity.stats, def) ?? {}
  const data = YEARS.filter((y) => series[String(y)] !== undefined).map((y) => ({
    year: String(y),
    value: series[String(y)],
  }))
  if (data.length < 2) return null
  return (
    <ChartContainer config={config} className="aspect-[2/1] w-full">
      <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
        <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis
          width={48}
          tickLine={false}
          axisLine={false}
          fontSize={11}
          tickFormatter={(v: number) => formatValue(v, def.format)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={{ r: 2 }} />
      </LineChart>
    </ChartContainer>
  )
}
