import type { CityEntity, Entity, SourceInfo, StateEntity } from './types'
import { STAT_BY_ID, type StatId } from './stats'
import { attachLivabilityScores } from './score'
import statesJson from '@/data/states.json'
import citiesJson from '@/data/cities.json'
import sourcesJson from '@/data/sources.json'

export const STATES: Record<string, StateEntity> = statesJson as Record<string, StateEntity>
export const STATE_LIST: StateEntity[] = Object.values(STATES)
export const STATE_BY_FIPS: Record<string, StateEntity> = Object.fromEntries(
  STATE_LIST.map((s) => [s.fips, s]),
)
export const CITIES: CityEntity[] = citiesJson as CityEntity[]
export const CITY_BY_ID: Record<string, CityEntity> = Object.fromEntries(CITIES.map((c) => [c.id, c]))
attachLivabilityScores(STATE_LIST, CITIES)
export const SOURCES: SourceInfo[] = sourcesJson as SourceInfo[]

export function entityById(id: string | null | undefined): Entity | undefined {
  if (!id) return undefined
  return STATE_LIST.find((s) => s.id === id) ?? CITIES.find((c) => c.id === id)
}

export function peersOf(entity: Entity): Entity[] {
  return entity.level === 'state' ? STATE_LIST : CITIES
}

export function isPartial(entity: Entity, statId: StatId, year: number): boolean {
  return entity.partial?.[statId]?.includes(year) ?? false
}

export function sourceFor(statId: StatId): SourceInfo | undefined {
  return SOURCES.find((s) => s.statId === statId) ?? SOURCES.find((s) => s.statId === STAT_BY_ID[statId].id)
}
