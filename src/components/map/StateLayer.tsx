import type { GeoPermissibleObjects } from 'd3-geo'
import type { ColorScale } from '@/lib/colors'
import { STATE_BY_FIPS } from '@/lib/data'
import type { StatDef } from '@/lib/stats'
import { getValue } from '@/lib/stats'
import { yoy } from '@/lib/trends'
import type { ColorMode } from '@/lib/url-state'

export function StateLayer({
  geographies,
  path,
  scale,
  def,
  year,
  mode,
  selectedId,
  onHover,
  onLeave,
  onClick,
}: {
  geographies: GeoJSON.Feature[]
  path: (feat: GeoPermissibleObjects) => string | null
  scale: ColorScale | undefined
  def: StatDef
  year: number
  mode: ColorMode
  selectedId: string | null
  onHover: (id: string, name: string, evt: React.MouseEvent) => void
  onLeave: () => void
  onClick: (id: string) => void
}) {
  return (
    <g>
      {geographies.map((geo) => {
        const fips = String(geo.id ?? '').padStart(2, '0')
        const st = STATE_BY_FIPS[fips]
        const d = path(geo as unknown as GeoPermissibleObjects) ?? ''
        if (!d) return null
        const value = st ? getValue(st.stats, def, year) : undefined
        const change = st ? yoy(st, def, year)?.pct : undefined
        const fill = scale?.color(mode === 'change' ? change : value) ?? '#e5e5e5'
        const selected = st?.abbr === selectedId
        const name = (geo.properties as { name?: string } | null)?.name ?? fips
        return (
          <path
            key={fips + name}
            d={d}
            fill={fill}
            stroke={selected ? 'var(--foreground)' : '#fff'}
            strokeWidth={selected ? 1.6 : 0.6}
            className="cursor-pointer transition-colors duration-200 hover:stroke-foreground/80"
            onMouseMove={(evt) => st && onHover(st.abbr, st.name, evt)}
            onMouseLeave={onLeave}
            onClick={() => st && onClick(st.abbr)}
          />
        )
      })}
    </g>
  )
}
