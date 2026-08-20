import type { APIMstSlotitem } from 'kcsapi/api_start2/getData/response'
import type { ConstState } from 'views/redux/const'
import type { Equip } from 'views/redux/info/equips'

import type { SelectorTables } from './tables'

import { equipType, equipTypeForFilter, equipTypeSp, typesOfCategory } from './equip-type'
import { canShipEquip } from './equipability'
import { getSelectorTables } from './tables'
import { AIRBASE_ROWS_PER_PAGE, positionOf, type SelectorPosition } from './types'

export * from './equip-type'

export const ALL_EQUIPS_CATEGORY = 0

/** An owned equipment paired with its master data. */
export interface EquipEntry {
  equip: Equip
  $equip: APIMstSlotitem
  /** Roster id of the ship carrying it, if any. */
  equippedOn?: number
}

// Field accessors, named after the game's own slot-item model properties.
const mstID = (e: EquipEntry) => e.$equip.api_id ?? 0
const memID = (e: EquipEntry) => e.equip.api_id ?? 0
const level = (e: EquipEntry) => e.equip.api_level ?? 0

const asc = (a: number, b: number) => (a < b ? -1 : a > b ? 1 : 0)
const desc = (a: number, b: number) => (a > b ? -1 : a < b ? 1 : 0)

/**
 * Ports `SlotUtil.sort`. Note the primary key is `equipTypeSp`, *not* the
 * master sort index: the picker groups by equipment type first and only then
 * by master id, so two items of the same type sit together regardless of
 * `api_sortno`.
 *
 * Key 0 is what the normal picker uses, and it has no improvement-level
 * tie-break at all — identical items are ordered purely by roster id. Keys 1
 * and 2 add a level tie-break and are reached only from the improvement
 * (改修) filter modes.
 */
export const compareEquips = (
  a: EquipEntry,
  b: EquipEntry,
  key = 0,
  tables: SelectorTables = getSelectorTables(),
  useSp = true,
): number => {
  const typeOf = useSp ? ($equip: EquipEntry['$equip']) => equipTypeSp($equip, tables) : equipType
  const byType = asc(typeOf(a.$equip), typeOf(b.$equip))
  if (byType !== 0) return byType
  const byMst = asc(mstID(a), mstID(b))
  if (byMst !== 0) return byMst
  switch (key) {
    case 1:
      return desc(level(a), level(b)) || asc(memID(a), memID(b))
    case 2:
      return asc(level(a), level(b)) || asc(memID(a), memID(b))
    default:
      return asc(memID(a), memID(b))
  }
}

export interface EquipFilter {
  /** Top-level category id; 0 is 全装備. */
  category: number
  /** Optional detail category within the tab. */
  detail?: number
  sortKey?: number
  /**
   * Master id of a ship to restrict the list to, the way the picker does when
   * it is opened from that ship's equipment screen. Needs `constState`.
   */
  forShipMstId?: number
  /**
   * Roster id of that same ship. The 他艦娘装備中 list hides equipment the
   * target ship is already carrying, which `isEquipAbleSlot` does by roster id.
   */
  forShipMemId?: number
}

/**
 * The picker keeps two separate lists and shows one at a time: 未装備 (items on
 * no ship) and 他艦娘装備中 (items carried by some ship). They paginate
 * independently, so an item's page and row only mean anything relative to the
 * list it belongs to.
 */
export type EquipListMode = 'unset' | 'set'

export interface EquipLists {
  unset: EquipEntry[]
  set: EquipEntry[]
}

export interface EquipListPosition extends SelectorPosition {
  mode: EquipListMode
}

/**
 * Ports `SlotUtil.filter`: a detail category, when picked, replaces the tab's
 * own type set rather than intersecting with it. Category 0 accepts everything.
 *
 * The per-ship restriction is applied on top, matching `createSlotList`, which
 * runs `isEquipAbleSlot` over the category-filtered list.
 */
export const filterEquips = (
  entries: EquipEntry[],
  filter: EquipFilter,
  constState?: ConstState,
  tables: SelectorTables = getSelectorTables(),
): EquipEntry[] => {
  // Category 0 short-circuits before the detail category is even consulted.
  const byCategory =
    filter.category === ALL_EQUIPS_CATEGORY ? entries : filterByCategory(entries, filter, tables)
  if (filter.forShipMstId == null || !constState) return byCategory
  const shipMstId = filter.forShipMstId
  return byCategory.filter((entry) => canShipEquip(shipMstId, entry.$equip, constState, tables))
}

const filterByCategory = (
  entries: EquipEntry[],
  filter: EquipFilter,
  tables: SelectorTables,
): EquipEntry[] => {
  const types = filter.detail
    ? (tables.filteringDetailCategories[filter.detail] ?? [])
    : typesOfCategory(filter.category, tables)
  // A category that accepts nothing shows nothing. Falling through to the whole
  // inventory would turn an unknown id into a silent "no filter at all", where
  // the ship and land base paths both yield an empty list.
  if (types.length === 0) return []
  const accepted = new Set(types)
  return entries.filter((entry) => accepted.has(equipTypeForFilter(entry.$equip, tables)))
}

export const sortEquips = (
  entries: EquipEntry[],
  sortKey = 0,
  tables: SelectorTables = getSelectorTables(),
): EquipEntry[] => [...entries].sort((a, b) => compareEquips(a, b, sortKey, tables))

export const buildEquipList = (
  entries: EquipEntry[],
  filter: EquipFilter,
  constState?: ConstState,
  tables: SelectorTables = getSelectorTables(),
): EquipEntry[] =>
  sortEquips(filterEquips(entries, filter, constState, tables), filter.sortKey, tables)

/**
 * Splits the filtered inventory into the picker's two lists.
 *
 * `_generateUnsetList` collects equipment on no ship; `_generateSetList` walks
 * every ship's slots, including the ex-slot. When the picker is scoped to a
 * ship, `isEquipAbleSlot` additionally drops that ship's own equipment from the
 * 他艦娘装備中 list — it is already on the target, so it is not "on another".
 */
export const buildEquipLists = (
  entries: EquipEntry[],
  filter: EquipFilter,
  constState?: ConstState,
  tables: SelectorTables = getSelectorTables(),
): EquipLists => {
  const filtered = filterEquips(entries, filter, constState, tables)
  const unset: EquipEntry[] = []
  const set: EquipEntry[] = []
  for (const entry of filtered) {
    if (entry.equippedOn == null) {
      unset.push(entry)
    } else if (filter.forShipMemId == null || entry.equippedOn !== filter.forShipMemId) {
      set.push(entry)
    }
  }
  return {
    unset: sortEquips(unset, filter.sortKey, tables),
    set: sortEquips(set, filter.sortKey, tables),
  }
}

export const equipPositions = (list: EquipEntry[]): Map<number, SelectorPosition> =>
  new Map(list.map((entry, offset) => [entry.equip.api_id, positionOf(offset)]))

export interface AirbaseFilter {
  /** Tab id from `airbaseFilterTabs`. */
  tab: number
}

/**
 * The 基地航空隊 squadron picker, which is a third list with its own rules.
 *
 * `AirUnitList.update` filters by `equipTypeSp` against the tab's type set,
 * then sorts with `SlotUtil.sort(items, 0, false)` — note the `false`, which
 * makes the primary key the *raw* `api_type[2]` rather than `equipTypeSp`.
 *
 * It has no unset/set split: the game builds one list from the unequipped
 * squadrons plus everything already deployed to an air unit, which together is
 * simply "not carried by a ship".
 */
export const buildAirbaseList = (
  entries: EquipEntry[],
  filter: AirbaseFilter,
  tables: SelectorTables = getSelectorTables(),
): EquipEntry[] => {
  const tab = tables.airbaseFilterTabs.find((t) => t.id === filter.tab)
  if (!tab) return []
  const accepted = new Set(tab.types)
  return entries
    .filter((entry) => entry.equippedOn == null && accepted.has(equipTypeSp(entry.$equip, tables)))
    .sort((a, b) => compareEquips(a, b, 0, tables, false))
}

export const airbasePositions = (list: EquipEntry[]): Map<number, SelectorPosition> =>
  new Map(
    list.map((entry, offset) => [entry.equip.api_id, positionOf(offset, AIRBASE_ROWS_PER_PAGE)]),
  )

/**
 * Positions across both lists, each numbered from its own page 1, tagged with
 * which list the item is in so the caller can say where to look.
 */
export const equipListPositions = (lists: EquipLists): Map<number, EquipListPosition> => {
  const positions = new Map<number, EquipListPosition>()
  lists.unset.forEach((entry, offset) =>
    positions.set(entry.equip.api_id, { ...positionOf(offset), mode: 'unset' }),
  )
  lists.set.forEach((entry, offset) =>
    positions.set(entry.equip.api_id, { ...positionOf(offset), mode: 'set' }),
  )
  return positions
}
