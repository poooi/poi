import { EventEmitter } from 'views/utils/event-emitter'

/**
 * The two rosters the panel searches. Each has more than one in-game screen
 * behind it — 編成 / 改装 for ships, 装備 / 基地航空隊 for equipment — and those
 * are picked on the second row rather than here, since they share a roster and
 * differ only in how it is filtered and ordered.
 */
export type SearchMode = 'ship' | 'equip'

export const SEARCH_MODES: SearchMode[] = ['ship', 'equip']

export const isSearchMode = (value: string): value is SearchMode =>
  (SEARCH_MODES as string[]).includes(value)

/**
 * Restricts the equipment list to what one ship can carry, as the 🔍 on a ship
 * result row does. `name` is the raw `api_name`, translated where it is shown.
 */
export interface EquipScope {
  shipMstId: number
  shipMemId: number
  name: string
  /** Number of normal slots, so the slot picker offers exactly those. */
  slots: number
  /** Whether the ex-slot (補強増設) has been opened on this ship. */
  hasExtra: boolean
}

export interface SearchOpenEvent {
  /** Mode to open in; omitted keeps whatever the bar was last using. */
  mode?: SearchMode
  /** Opens the equipment list already scoped to a ship. */
  scope?: EquipScope
}

/**
 * The search bar lives at the poi-app root, so anything (the admiral panel
 * button, the hotkey, a plugin) can open it without owning the component.
 */
export const searchEventEmitter = new EventEmitter<SearchOpenEvent>()

export const openGlobalSearch = (mode?: SearchMode) => searchEventEmitter.emit({ mode })

/** Entry point for the ship tiles' right-click menu. */
export const openEquipSearchForShip = (scope: EquipScope) =>
  searchEventEmitter.emit({ mode: 'equip', scope })
