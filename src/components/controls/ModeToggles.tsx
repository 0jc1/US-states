import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ColorMode, Layer } from '@/lib/url-state'

export function ModeToggles({
  mode,
  layer,
  onMode,
  onLayer,
}: {
  mode: ColorMode
  layer: Layer
  onMode: (mode: ColorMode) => void
  onLayer: (layer: Layer) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleGroup
        type="single"
        size="sm"
        variant="outline"
        value={mode}
        onValueChange={(v) => {
          if (v === 'value' || v === 'change') onMode(v)
        }}
      >
        <ToggleGroupItem value="value">Value</ToggleGroupItem>
        <ToggleGroupItem value="change">YoY change</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup
        type="single"
        size="sm"
        variant="outline"
        value={layer}
        onValueChange={(v) => {
          if (v === 'states' || v === 'cities') onLayer(v)
        }}
      >
        <ToggleGroupItem value="states">States</ToggleGroupItem>
        <ToggleGroupItem value="cities">Cities</ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
