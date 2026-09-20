import { useCallback, useState } from 'react'
import { DEFAULT_STAT, DEFAULT_YEAR, MAX_YEAR, MIN_YEAR, STAT_BY_ID, type StatId } from './stats'

export type ColorMode = 'value' | 'change'
export type Layer = 'states' | 'cities'

export interface AppView {
  stat: StatId
  year: number
  mode: ColorMode
  layer: Layer
  selected: string | null
}

function parseSearch(search = window.location.search): AppView {
  const sp = new URLSearchParams(search)
  const statRaw = sp.get('stat') ?? DEFAULT_STAT
  const stat = statRaw in STAT_BY_ID ? (statRaw as StatId) : DEFAULT_STAT
  const yearNum = Number(sp.get('year') ?? DEFAULT_YEAR)
  const year = Number.isFinite(yearNum) ? Math.min(MAX_YEAR, Math.max(MIN_YEAR, Math.round(yearNum))) : DEFAULT_YEAR
  const mode = sp.get('mode') === 'change' ? 'change' : 'value'
  const layer = sp.get('layer') === 'cities' ? 'cities' : 'states'
  return { stat, year, mode, layer, selected: sp.get('id') }
}

function writeUrl(view: AppView) {
  const sp = new URLSearchParams()
  sp.set('stat', view.stat)
  sp.set('year', String(view.year))
  sp.set('mode', view.mode)
  sp.set('layer', view.layer)
  if (view.selected) sp.set('id', view.selected)
  const url = `${window.location.pathname}?${sp.toString()}`
  window.history.replaceState(view, '', url)
}

export function useAppView() {
  const [view, setViewState] = useState<AppView>(() =>
    typeof window === 'undefined'
      ? { stat: DEFAULT_STAT, year: DEFAULT_YEAR, mode: 'value', layer: 'states', selected: null }
      : parseSearch(),
  )

  const setView = useCallback((patch: Partial<AppView>) => {
    setViewState((current) => {
      const next = { ...current, ...patch }
      if (
        next.stat === current.stat &&
        next.year === current.year &&
        next.mode === current.mode &&
        next.layer === current.layer &&
        next.selected === current.selected
      ) {
        return current
      }
      writeUrl(next)
      return next
    })
  }, [])

  return { view, setView }
}
