import { geoAlbersUsa, geoPath, type GeoPermissibleObjects } from 'd3-geo'
import { select } from 'd3-selection'
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { feature } from 'topojson-client'
import { Button } from '@/components/ui/button'
import { makeChangeScale, makeValueScale, type ColorScale } from '@/lib/colors'
import { CITIES, entityById, STATE_LIST } from '@/lib/data'
import { getValue, type StatDef } from '@/lib/stats'
import { fireThreshold, isFire, yoy } from '@/lib/trends'
import type { ColorMode, Layer } from '@/lib/url-state'
import atlas from '@/data/geo/states-10m.json'
import { CityLayer } from './CityLayer'
import { MapLegend } from './MapLegend'
import { MapTooltip, type TooltipInfo } from './MapTooltip'
import { StateLayer } from './StateLayer'

const WIDTH = 975
const HEIGHT = 610

export function UsMap({
  def,
  year,
  mode,
  layer,
  selectedId,
  onSelect,
}: {
  def: StatDef
  year: number
  mode: ColorMode
  layer: Layer
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef(d3Zoom<SVGSVGElement, unknown>().scaleExtent([1, 8]))
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const [tip, setTip] = useState<TooltipInfo | null>(null)

  const geographies = useMemo(() => {
    const topo = atlas as unknown as Parameters<typeof feature>[0]
    const fc = feature(topo, topo.objects.states) as unknown as GeoJSON.FeatureCollection
    return fc.features
  }, [])

  const projection = useMemo(
    () =>
      geoAlbersUsa().fitSize([WIDTH, HEIGHT], {
        type: 'FeatureCollection',
        features: geographies,
      } as GeoPermissibleObjects),
    [geographies],
  )
  const pathFn = useMemo(() => geoPath(projection), [projection])

  const entities = layer === 'cities' ? CITIES : STATE_LIST
  const values = entities.map((e) =>
    mode === 'change' ? yoy(e, def, year)?.pct : getValue(e.stats, def, year),
  )
  const numeric = values.filter((v): v is number => typeof v === 'number')
  const scale = mode === 'change' ? makeChangeScale(numeric, def) : makeValueScale(numeric, def)
  const muted: ColorScale | undefined = scale
    ? { ...scale, color: () => '#e7e5e4' }
    : undefined
  const fires = fireThreshold(entities, def, year)

  useEffect(() => {
    const node = svgRef.current
    if (!node) return
    const z = zoomRef.current
      .translateExtent([
        [0, 0],
        [WIDTH, HEIGHT],
      ])
      .on('zoom', (event) => {
        const t = event.transform
        setTransform({ x: t.x, y: t.y, k: t.k })
      })
    const sel = select(node)
    sel.call(z)
    sel.on('dblclick.zoom', null)
    return () => {
      sel.on('.zoom', null)
    }
  }, [])

  function hover(id: string, name: string, evt: React.MouseEvent) {
    const entity = entityById(id)
    if (!entity) return
    const rect = svgRef.current?.parentElement?.getBoundingClientRect()
    const trend = yoy(entity, def, year)
    setTip({
      x: evt.clientX - (rect?.left ?? 0),
      y: evt.clientY - (rect?.top ?? 0),
      name,
      subtitle: entity.level === 'city' ? entity.state : undefined,
      value: getValue(entity.stats, def, year),
      yoy: trend?.pct,
      fire: isFire(def, trend, fires),
      partial: entity.partial?.[def.id]?.includes(year) ?? false,
    })
  }

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--muted)_0%,_transparent_55%)]">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-full w-full touch-none"
        role="img"
        aria-label="United States map"
      >
        <defs>
          <pattern id="no-data-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#d4d4d4" strokeWidth="2" />
          </pattern>
        </defs>
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          <StateLayer
            geographies={geographies}
            path={(feat) => pathFn(feat as GeoPermissibleObjects)}
            scale={layer === 'states' ? scale : muted}
            def={def}
            year={year}
            mode={layer === 'states' ? mode : 'value'}
            selectedId={selectedId}
            onHover={hover}
            onLeave={() => setTip(null)}
            onClick={onSelect}
          />
          <CityLayer
            projection={projection}
            scale={scale}
            def={def}
            year={year}
            mode={mode}
            layer={layer}
            selectedId={selectedId}
            onHover={hover}
            onLeave={() => setTip(null)}
            onClick={onSelect}
          />
        </g>
      </svg>
      <MapTooltip info={tip} def={def} mode={mode} />
      <MapLegend scale={scale} def={def} mode={mode} vintage={`${year}`} />
      <Button
        size="sm"
        variant="outline"
        className="absolute right-3 top-3"
        onClick={() => {
          const node = svgRef.current
          if (!node) return
          setTransform({ x: 0, y: 0, k: 1 })
          select(node).call(zoomRef.current.transform, zoomIdentity)
        }}
      >
        Reset view
      </Button>
    </div>
  )
}
