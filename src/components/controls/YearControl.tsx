import { Pause, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { MAX_YEAR, MIN_YEAR, YEARS } from '@/lib/stats'

export function YearControl({
  year,
  onChange,
}: {
  year: number
  onChange: (year: number) => void
}) {
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      onChange(year >= MAX_YEAR ? MIN_YEAR : year + 1)
    }, 900)
    return () => window.clearInterval(id)
  }, [playing, year, onChange])

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        aria-label={playing ? 'Pause year animation' : 'Play year animation'}
        onClick={() => setPlaying((p) => !p)}
      >
        {playing ? <Pause /> : <Play />}
      </Button>
      <div className="min-w-0 flex-1">
        <Slider
          min={MIN_YEAR}
          max={MAX_YEAR}
          step={1}
          value={[year]}
          onValueChange={(v) => onChange(v[0] ?? year)}
        />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          {YEARS.map((y) => (
            <span key={y} className={y === year ? 'font-medium text-foreground' : ''}>
              {y}
            </span>
          ))}
        </div>
      </div>
      <div className="w-12 text-right font-heading text-sm font-medium tabular-nums">{year}</div>
    </div>
  )
}
