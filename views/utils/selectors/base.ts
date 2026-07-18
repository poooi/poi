import type { APIMstMapinfo, APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'
import type { Equip } from 'views/redux/info/equips'
import type { MapInfo, MapsState } from 'views/redux/info/maps'
import type { Ship, ShipsState } from 'views/redux/info/ships'
import type { RootState } from 'views/redux/reducer-factory'

import { get, zip } from 'lodash'
import { createSelector, createSelectorCreator, lruMemoize } from 'reselect'

//### Local Types ###

export type ExtendedMapInfo = MapInfo & {
  api_required_defeat_count?: number
  api_defeat_count?: number
}
export type StateWithOnslot = { state: RootState; onslot: number | undefined }
export type ShipData = [Ship, APIMstShip]
export type EquipDataWithOnslot = [Equip, APIMstSlotitem, number | undefined]
export type MapData = [MapInfo, APIMstMapinfo]

//### Helpers ###

function deepCompareArray(currentVal: unknown, previousVal: unknown): boolean {
  if (currentVal === previousVal) return true
  if (
    Array.isArray(currentVal) &&
    Array.isArray(previousVal) &&
    currentVal.length === previousVal.length
  ) {
    return zip(currentVal, previousVal).every(([a, b]) => a === b)
  } else {
    return false
  }
}

// This kind of selector specially treats array arguments by `===` comparing
// its items one by one
export const createDeepCompareArraySelector = createSelectorCreator(lruMemoize, deepCompareArray)

// This wrapper prevents different array (in terms of ===) being returned
// despite having the same elements
export function arrayResultWrapper<S, T>(selector: (state: S) => T): (state: S) => T {
  return createDeepCompareArraySelector([selector], (result: T) => result)
}

export function getMapData(
  mapId: number | string | null | undefined,
  maps: MapsState | null | undefined,
  $maps: Record<string, APIMstMapinfo> | null | undefined,
): MapData | undefined {
  if (mapId == 0 || mapId == null || maps == null || $maps == null) return
  const numericId = Number(mapId)
  if (Number.isNaN(numericId) || !maps[numericId] || !$maps[numericId]) return
  return [maps[numericId], $maps[numericId]]
}

// Returns [nowHp, maxHp, gaugeType]
// where nowHp === 0 means cleared
export function getMapHp(
  map: ExtendedMapInfo | undefined,
  $map: APIMstMapinfo | undefined,
): [number | undefined, number | undefined, number | undefined] | undefined {
  if (!map || !$map) return
  if (map.api_eventmap) {
    const { api_now_maphp, api_max_maphp, api_gauge_type } = map.api_eventmap
    return [api_now_maphp, api_max_maphp, api_gauge_type]
  }
  const maxCount = map.api_required_defeat_count
  if (!maxCount) return
  const nowCount = map.api_defeat_count ?? maxCount
  const nowHp = maxCount - nowCount
  return [nowHp, maxCount, undefined]
}

export function getFleetInfoFromSlices(
  deckShipId: number[],
  ships: ShipsState | undefined,
  $ships: Record<string, APIMstShip> | undefined,
): { shipname: string[]; shiptype: number[]; shipclass: number[] } {
  const shipname: string[] = []
  const shiptype: number[] = []
  const shipclass: number[] = []
  deckShipId.forEach((id) => {
    const $ship = $ships?.[ships?.[id]?.api_ship_id ?? -1]
    if (!$ship) return
    if (($ship.api_name ?? '').length > 0) shipname.push($ship.api_name)
    if (($ship.api_stype ?? -1) > 0) shiptype.push($ship.api_stype)
    if (($ship.api_ctype ?? -1) > 0) shipclass.push($ship.api_ctype)
  })
  return { shipname, shiptype, shipclass }
}

export function getFleetInfo(
  deckShipId: number[],
  state: RootState,
): { shipname: string[]; shiptype: number[]; shipclass: number[] } {
  return getFleetInfoFromSlices(deckShipId, state.info?.ships, state.const?.$ships)
}

//### Selectors ###
// Use it sparingly
export const stateSelector = (state: RootState): RootState => state

export const constSelector = (state: RootState) => state.const
export const basicSelector = (state: RootState) => state.info.basic
export const configSelector = (state: RootState) => state.config
export const miscSelector = (state: RootState) => state.misc
export const fleetsSelector = (state: RootState) => state.info.fleets
export const shipsSelector = (state: RootState) => state.info.ships
export const equipsSelector = (state: RootState) => state.info.equips
export const repairsSelector = (state: RootState) => state.info.repairs
export const mapsSelector = (state: RootState) => state.info.maps
export const sortieSelector = (state: RootState) => state.sortie
export const sortieStatusSelector = (state: RootState) => state.sortie.sortieStatus
export const currentNodeSelector = (state: RootState) => state.sortie.currentNode
export const battleSelector = (state: RootState) => state.battle
export const fcdSelector = (state: RootState) => state.fcd
export const ipcSelector = (state: RootState) => state.ipc
export const wctfSelector = (state: RootState) => state.wctf
export const layoutSelector = (state: RootState) => state.layout
export const fcdShipTagColorSelector = (state: RootState) => state.fcd?.shiptag?.color ?? []

export const extensionSelectorFactory =
  (key: string) =>
  (state: RootState): Record<string, unknown> =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    (get(state.ext, [key, '_']) as Record<string, unknown> | undefined) ?? {}

export const configLayoutSelector = createSelector(configSelector, (config) =>
  get(config, 'poi.layout.mode', 'horizontal'),
)
export const configDoubleTabbedSelector = createSelector(configSelector, (config) =>
  get(config, 'poi.tabarea.double', false),
)
export const configZoomLevelSelector = createSelector(configSelector, (config) =>
  get(config, 'poi.appearance.zoom', 1),
)
export const configReverseLayoutSelector = createSelector(configSelector, (config) =>
  get(config, 'poi.layout.reverse', false),
)

export const condTickSelector = (state: RootState) => state.timers.cond.tick
