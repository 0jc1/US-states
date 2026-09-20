import type { GeoProjection } from 'd3-geo'
import { scaleSqrt } from 'd3-scale'
import { CITIES } from '@/lib/data'
import type { ColorScale } from '@/lib/colors'
import type { StatDef } from '@/lib/stats'
import { getValue } from '@/lib/stats'
import { yoy } from '@/lib/trends'
import type { ColorMode, Layer } from '@/lib/url-state'

export function CityLayer({
  projection,
  scale,
  def,
  year,
  mode,
  layer,
  selectedId,
  onHover,
  onLeave,
  onClick,
}: {
  projection: GeoProjection
  scale: ColorScale | undefined
  def: StatDef
  year: number
  mode: ColorMode
  layer: Layer
  selectedId: string | null
  onHover: (id: string, name: string, evt: React.MouseEvent) => void
  onLeave: () => void
  onClick: (id: string) => void
}) {
  const pops = CITIES.map((c) => c.stats.population?.[String(year)] ?? 0)
  const r = scaleSqrt()
    .domain([0, Math.max(...pops, 1)])
    .range(layer === 'cities' ? [3, 18] : [1.4, 6])

  return (
    <g>
      {CITIES.map((city) => {
        const xy = projection([city.lng, city.lat])
        if (!xy) return null
        const pop = city.stats.population?.[String(year)] ?? 0
        const value = getValue(city.stats, def, year)
        const change = yoy(city, def, year)?.pct
        const fill =
          layer === 'cities'
            ? (scale?.color(mode === 'change' ? change : value) ?? '#737373')
            : '#171717'
        const selected = city.id === selectedId
        return (
          <circle
            key={city.id}
            cx={xy[0]}
            cy={xy[1]}
            r={r(pop)}
            fill={typeof fill === 'string' && fill.startsWith('url') ? '#d4d4d4' : fill}
            fillOpacity={layer === 'cities' ? 0.92 : 0.7}
            stroke={selected ? '#fff' : '#fff'}
            strokeWidth={selected ? 2 : 0.6}
            className="cursor-pointer hover:stroke-foreground"
            onMouseMove={(evt) => onHover(city.id, city.name, evt)}
            onMouseLeave={onLeave}
            onClick={(evt) => {
              evt.stopPropagation()
              onClick(city.id)
            }}
          />
        )
      })}
    </g>
  )
}
