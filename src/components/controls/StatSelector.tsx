import { STAT_DEFS, STAT_GROUPS, type StatId } from '@/lib/stats'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function StatSelector({
  value,
  onChange,
  layer,
}: {
  value: StatId
  onChange: (id: StatId) => void
  layer: 'states' | 'cities'
}) {
  const defs = STAT_DEFS.filter((s) => (layer === 'cities' ? s.levels.includes('city') : s.levels.includes('state')))
  return (
    <Select value={value} onValueChange={(v) => onChange(v as StatId)}>
      <SelectTrigger className="min-w-56" size="sm">
        <SelectValue placeholder="Select a stat" />
      </SelectTrigger>
      <SelectContent>
        {STAT_GROUPS.map((group) => {
          const items = defs.filter((s) => s.group === group)
          if (!items.length) return null
          return (
            <SelectGroup key={group}>
              <SelectLabel>{group}</SelectLabel>
              {items.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.shortLabel}
                </SelectItem>
              ))}
            </SelectGroup>
          )
        })}
      </SelectContent>
    </Select>
  )
}
