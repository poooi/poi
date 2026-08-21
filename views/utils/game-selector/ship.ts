import type { APIMstShip } from 'kcsapi/api_start2/getData/response'
import type { MapsState } from 'views/redux/info/maps'
import type { Ship } from 'views/redux/info/ships'

import type { SelectorTables, ShipFilterTab } from './tables'

import { getSelectorTables } from './tables'
import { positionOf, type SelectorPosition } from './types'

/**
 * Filter tabs of the in-game 艦船選択 picker, in on-screen order.
 *
 * The `stypes` lists mirror `ShipUtil.filterByShipFilterType`: each tab maps to
 * a fixed set of `api_stype` values, and the tabs are *independently* toggled,
 * so the effective filter is the union of every enabled tab. The 全艦艇 button
 * in game is a select-all/none toggle over these eight, not a ninth tab.
 *
 * The table itself lives in `./tables` so fcd can correct it without a release.
 */
export const shipFilterTabs = (tables: SelectorTables = getSelectorTables()): ShipFilterTab[] =>
  tables.shipFilterTabs

export const allShipTabIds = (tables: SelectorTables = getSelectorTables()): number[] =>
  tables.shipFilterTabs.map((tab) => tab.id)

/**
 * Event-tag filter, mirroring `ShipUtil.filterByTag`. The game's status values
 * are 0/1 (no filtering), 2 (tagged) and 3 (untagged).
 */
export type ShipTagFilter = 'all' | 'tagged' | 'untagged'

/**
 * Sort keys of `ShipUtil.sort`. The 編成 picker's sort button cycles through
 * 1 → 2 → 3 → 4 → 5 → 6 → 1; there is no separate ascending/descending toggle,
 * because each key already carries its own direction. Key 0 is the ascending
 * mirror of key 1 and is used by other scenes, not by this picker.
 */
export const SHIP_SORT_KEYS = [1, 2, 3, 4, 5, 6] as const

export type ShipSortKey = (typeof SHIP_SORT_KEYS)[number]

/** Japanese captions for the sort button, as printed in game. */
export const SHIP_SORT_KEY_NAMES: Record<ShipSortKey, string> = {
  1: 'Lv',
  2: '艦種',
  3: '新着',
  4: '損傷',
  5: '修復',
  6: '疲労',
}

/** A roster ship paired with its master data, as the picker rows need both. */
export interface ShipEntry {
  ship: Ship
  $ship: APIMstShip
}

// Field accessors, named after the game's own ship-model properties.
const level = (e: ShipEntry) => e.ship.api_lv ?? 0
/** `sortNo` on the game's ship model reads `api_sort_id` off the master data. */
const sortNo = (e: ShipEntry) => e.$ship.api_sort_id ?? 0
const memID = (e: ShipEntry) => e.ship.api_id ?? 0
const hpRatio = (e: ShipEntry) => {
  const max = e.ship.api_maxhp ?? 0
  return max === 0 ? 0 : (e.ship.api_nowhp ?? 0) / max
}
const repairTime = (e: ShipEntry) => e.ship.api_ndock_time ?? 0
const cond = (e: ShipEntry) => e.ship.api_cond ?? 0

/** Ascending numeric comparison. */
const asc = (a: number, b: number) => (a < b ? -1 : a > b ? 1 : 0)
/** Descending numeric comparison. */
const desc = (a: number, b: number) => (a > b ? -1 : a < b ? 1 : 0)

/**
 * The shared tail of most of the game's ship comparators: master sort index
 * ascending, then roster id ascending.
 */
const compareTail = (a: ShipEntry, b: ShipEntry) =>
  asc(sortNo(a), sortNo(b)) || asc(memID(a), memID(b))

/**
 * Ports `ShipUtil.sort`. Each key fixes its own direction; the directions below
 * are read straight off the game's comparators.
 */
export const compareShips = (a: ShipEntry, b: ShipEntry, key: number): number => {
  switch (key) {
    // Level ascending; the mirror of key 1, used by scenes other than 編成.
    case 0:
      return asc(level(a), level(b)) || desc(sortNo(a), sortNo(b)) || desc(memID(a), memID(b))
    // Lv: level descending.
    case 1:
      return desc(level(a), level(b)) || compareTail(a, b)
    // 艦種: master sort index ascending, then level descending.
    case 2:
      return asc(sortNo(a), sortNo(b)) || desc(level(a), level(b)) || asc(memID(a), memID(b))
    // 新着: newest roster id first, with no further tie-break.
    case 3:
      return desc(memID(a), memID(b))
    // 損傷: lowest HP ratio first.
    case 4:
      return asc(hpRatio(a), hpRatio(b)) || compareTail(a, b)
    // 修復: longest repair time first.
    case 5:
      return desc(repairTime(a), repairTime(b)) || compareTail(a, b)
    // 疲労: highest condition value first.
    case 6:
      return desc(cond(a), cond(b)) || compareTail(a, b)
    default:
      return 0
  }
}

export interface ShipFilter {
  /** Enabled tab ids; the effective filter is the union of their ship types. */
  tabs: number[]
  tag: ShipTagFilter
  sortKey: ShipSortKey
}

export const filterShips = (
  entries: ShipEntry[],
  filter: ShipFilter,
  tables: SelectorTables = getSelectorTables(),
): ShipEntry[] => {
  const stypes = new Set(
    filter.tabs.flatMap((id) => tables.shipFilterTabs.find((tab) => tab.id === id)?.stypes ?? []),
  )
  const byType = entries.filter((entry) => stypes.has(entry.$ship.api_stype))
  switch (filter.tag) {
    case 'tagged':
      return byType.filter((entry) => (entry.ship.api_sally_area ?? 0) !== 0)
    case 'untagged':
      return byType.filter((entry) => (entry.ship.api_sally_area ?? 0) === 0)
    default:
      return byType
  }
}

export const sortShips = (entries: ShipEntry[], sortKey: number): ShipEntry[] =>
  [...entries].sort((a, b) => compareShips(a, b, sortKey))

/** The picker's list for a filter, in on-screen order. */
export const buildShipList = (
  entries: ShipEntry[],
  filter: ShipFilter,
  tables: SelectorTables = getSelectorTables(),
): ShipEntry[] => sortShips(filterShips(entries, filter, tables), filter.sortKey)

export const shipPositions = (list: ShipEntry[]): Map<number, SelectorPosition> =>
  new Map(list.map((entry, offset) => [entry.ship.api_id, positionOf(offset)]))

/** Standard worlds are 1–7; anything past this is an event world. */
const LAST_NORMAL_WORLD = 10

/** The world (maparea) a map belongs to: `api_id` is world × 10 + map number. */
export const worldOf = (mapId: number): number => Math.floor(mapId / 10)

/**
 * Is a seasonal event running?
 *
 * The tag filter only exists in the picker while an event is on. Rather than
 * track main.js's hardcoded `EventConst.AREA_ID`, read it off the player's own
 * map list: event maps live in worlds above the standard ones, and they
 * disappear from the list when the event closes.
 */
export const isEventActive = (maps: MapsState | undefined): boolean =>
  Object.values(maps ?? {}).some((map) => worldOf(map?.api_id ?? 0) > LAST_NORMAL_WORLD)
