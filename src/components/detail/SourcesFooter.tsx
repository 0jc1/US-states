import { SOURCES } from '@/lib/data'

export function SourcesFooter() {
  return (
    <div className="space-y-2 text-[11px] leading-snug text-muted-foreground">
      {SOURCES.map((s) => (
        <p key={s.statId}>
          <span className="font-medium text-foreground">{s.statId}</span> · {s.publisher}, {s.dataset} ({s.vintage}
          ). {s.notes}
        </p>
      ))}
    </div>
  )
}
