import type { APIMstMapinfo, APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'
import type { AirBase } from 'views/redux/info/airbase'
import type { Equip } from 'views/redux/info/equips'
import type { MapInfo, MapsState } from 'views/redux/info/maps'
import type { RepairData } from 'views/redux/info/repairs'
import type { Ship } from 'views/redux/info/ships'
import type { RootState } from 'views/redux/reducer-factory'
import type { SortieState } from 'views/redux/sortie'

import memoize from 'fast-memoize'
import { get, map, zip, flatMap, values, fromPairs } from 'lodash'
import { createSelector, createSelectorCreator, lruMemoize } from 'reselect'

//### Local Types ###

type ExtendedMapInfo = MapInfo & { api_required_defeat_count?: number; api_defeat_count?: number }
type StateWithOnslot = { state: RootState; onslot: number | undefined }
type ShipData = [Ship, APIMstShip]
type EquipDataWithOnslot = [Equip, APIMstSlotitem, number | undefined]
type MapData = [MapInfo, APIMstMapinfo]

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
function arrayResultWrapper<S, T>(selector: (state: S) => T): (state: S) => T {
  // createDeepCompareArraySelector has the same call semantics as createSelector but
  // with a custom equality check. We assert the state type to satisfy reselect's
  // overloads; the actual type parameter S is preserved via the outer cast.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const typedSelector = selector as (state: RootState) => T
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return createDeepCompareArraySelector(typedSelector, (result: T) => result) as (state: S) => T
}

function getDeckState(
  shipsData: (ShipData | undefined)[] | undefined = [],
  inBattle: unknown,
  inExpedition: unknown,
  inRepairShipsId: number[] | undefined,
): number {
  let state = 0
  if (inBattle) state = Math.max(state, 5)
  if (inExpedition) state = Math.max(state, 4)
  shipsData?.forEach((pair) => {
    if (!pair) return
    const [ship, $ship] = pair
    if (!ship || !$ship) return
    // Cond < 20 or medium damage
    if ((ship.api_cond ?? 100) < 20 || (ship.api_nowhp ?? 1) / (ship.api_maxhp ?? 1) < 0.25)
      state = Math.max(state, 2)
    // Cond < 40 or heavy damage
    else if ((ship.api_cond ?? 100) < 40 || (ship.api_nowhp ?? 1) / (ship.api_maxhp ?? 1) < 0.5)
      state = Math.max(state, 1)
    // Not supplied
    if (
      (ship.api_fuel ?? 0) / ($ship.api_fuel_max ?? 1) < 0.99 ||
      (ship.api_bull ?? 0) / ($ship.api_bull_max ?? 1) < 0.99
    )
      state = Math.max(state, 1)
    // Repairing
    if (inRepairShipsId?.includes(ship.api_id)) state = Math.max(state, 3)
  })
  return state
}

function getMapData(
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
function getMapHp(
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

// Returns [shipId for every ship in repair]
// Returns undefined if uninitialized
export const inRepairShipsIdSelector = arrayResultWrapper(
  createSelector(repairsSelector, (repairs: RepairData[] | undefined) => {
    if (!repairs) return
    return map(
      repairs.filter((repair) => repair.api_state == 1),
      'api_ship_id',
    )
  }),
)

export const fleetSelectorFactory = memoize(
  (fleetId: number) => (state: RootState) => (state.info.fleets || [])[fleetId],
)
export const landbaseSelectorFactory = memoize(
  (landbaseId: number) => (state: RootState) => (state.info.airbase || [])[landbaseId],
)

// Returns [shipId] of this fleet
// Returns undefined if fleet not found
export const fleetShipsIdSelectorFactory = memoize((fleetId: number) =>
  arrayResultWrapper(
    createSelector(fleetSelectorFactory(fleetId), (fleet) => {
      if (fleet == null) return
      return fleet.api_ship.filter((n) => n != -1)
    }),
  ),
)

export const fleetSlotCountSelectorFactory = memoize((fleetId: number) =>
  createSelector([fleetSelectorFactory(fleetId)], (fleet) => get(fleet, 'api_ship.length', 0)),
)

export const fleetInBattleSelectorFactory = memoize((fleetId: number) =>
  createSelector(sortieStatusSelector, (sortieStatus) => sortieStatus[fleetId]),
)
export const fleetInExpeditionSelectorFactory = memoize((fleetId: number) =>
  createSelector(fleetSelectorFactory(fleetId), (fleet) =>
    typeof fleet === 'object' ? (fleet.api_mission?.[0] ?? false) : false,
  ),
)
export const fleetNameSelectorFactory = memoize((fleetId: number) =>
  createSelector(fleetSelectorFactory(fleetId), (fleet) =>
    typeof fleet === 'object' ? (fleet.api_name ?? '') : '',
  ),
)
export const fleetStateSelectorFactory = memoize((fleetId: number) =>
  createSelector(
    [
      fleetInBattleSelectorFactory(fleetId),
      fleetInExpeditionSelectorFactory(fleetId),
      inRepairShipsIdSelector,
      fleetShipsDataSelectorFactory(fleetId),
    ],
    (inBattle, inExpedition, inRepairShipsId, shipsData) =>
      getDeckState(shipsData, inBattle, inExpedition, inRepairShipsId),
  ),
)

const emptyExpedition = [0, 0, 0, 0]
export const fleetExpeditionSelectorFactory = memoize((fleetId: number) =>
  createSelector(fleetSelectorFactory(fleetId), (fleet) =>
    fleet ? (fleet.api_mission ?? emptyExpedition) : emptyExpedition,
  ),
)

// Reads props.fleetId
// Returns <repairDock> if this ship is in repair
// Returns undefined if uninitialized or not in repair
export const shipRepairDockSelectorFactory = memoize((shipId: number) =>
  createSelector(repairsSelector, (repairs) => {
    if (repairs == null) return
    return repairs.find(({ api_state, api_ship_id }) => api_state == 1 && api_ship_id == shipId)
  }),
)

// Selector for all ship ids that in sortie, including the -1 placeholders
const sortieShipIdSelector = arrayResultWrapper(
  createSelector(
    [
      fleetsSelector, // we need the -1 placeholder here because escapedPos is by index
      sortieSelector,
    ],
    (fleet, { sortieStatus }: SortieState) =>
      flatMap(sortieStatus, (sortie, index) => (sortie ? get(fleet, [index, 'api_ship'], []) : [])),
  ),
)

export const escapeStatusSelectorFactory = memoize((shipId: number) =>
  createSelector(
    [sortieShipIdSelector, sortieSelector],
    (sortieShipIds, { escapedPos }: SortieState) =>
      shipId > 0 && escapedPos.some((pos) => sortieShipIds[pos] === shipId),
  ),
)

// There's a Number type check
const shipBaseDataSelectorFactory = memoize((shipId: number) =>
  createSelector([shipsSelector], (ships) =>
    ships && typeof shipId === 'number' && shipId ? ships[shipId] : undefined,
  ),
)

// Reads props.shipId
// Returns [_ship, $ship]
// Returns undefined if uninitialized, or if ship not found in _ship
// Attention: shipId here only accepts Number type,
//   otherwise will always return undefined
export const shipDataSelectorFactory = memoize((shipId: number) =>
  arrayResultWrapper(
    createSelector([shipBaseDataSelectorFactory(shipId), constSelector], (ship, { $ships }) =>
      $ships && typeof ship === 'object' && ship
        ? ([ship, $ships[ship.api_ship_id ?? -1]] as ShipData)
        : undefined,
    ),
  ),
)

const shipSlotnumSelectorFactory = memoize((shipId: number) =>
  createSelector(shipBaseDataSelectorFactory(shipId), (ship) =>
    ship ? (ship.api_slotnum ?? 0) : 0,
  ),
)
const shipSlotSelectorFactory = memoize((shipId: number) =>
  createSelector(shipBaseDataSelectorFactory(shipId), (ship) => (ship ? ship.api_slot : undefined)),
)
const shipExslotSelectorFactory = memoize((shipId: number) =>
  createSelector(shipBaseDataSelectorFactory(shipId), (ship) =>
    ship ? (ship.api_slot_ex ?? -1) : -1,
  ),
)
const shipOnSlotSelectorFactory = memoize((shipId: number) =>
  createSelector(shipBaseDataSelectorFactory(shipId), (ship) =>
    ship ? ship.api_onslot : undefined,
  ),
)
const landbaseSlotnumSelectorFactory = memoize((landbaseId: number) =>
  createSelector(landbaseSelectorFactory(landbaseId), (landbase: AirBase | undefined) =>
    landbase ? (landbase.api_plane_info?.length ?? 0) : 0,
  ),
)
const landbaseOnSlotSelectorFactory = memoize((landbaseId: number) =>
  createSelector(landbaseSelectorFactory(landbaseId), (landbase: AirBase | undefined) =>
    landbase ? landbase.api_plane_info?.map((l) => l.api_count) : undefined,
  ),
)

// Returns [equipId for each slot on the ship]
// length is always 5 + 1(ex slot)
// Slot is padded with -1 for each empty slot
// Returns undefined if ship is undefined
const shipEquipsIdSelectorFactory = memoize((shipId: number) =>
  arrayResultWrapper(
    createSelector(
      [shipSlotSelectorFactory(shipId), shipExslotSelectorFactory(shipId)],
      (slot, exslot) => (slot ? slot.concat(exslot).map((i) => parseInt(String(i))) : undefined),
    ),
  ),
)
const landbaseEquipsIdSelectorFactory = memoize((landbaseId: number) =>
  arrayResultWrapper(
    createSelector(landbaseSelectorFactory(landbaseId), (landbase: AirBase | undefined) =>
      landbase ? (landbase.api_plane_info?.map((l) => l.api_slotid) ?? []) : [],
    ),
  ),
)

// There's a Number type check
const equipBaseDataSelectorFactory = memoize((equipId: number) =>
  createSelector([equipsSelector], (equips) =>
    equips && typeof equipId === 'number' && equipId ? equips[equipId] : undefined,
  ),
)

// Returns [_equip, $equip]
// Returns undefined if uninitialized, or if equip not found in _equip
// Attention: equipId here only accepts Number type,
//   otherwise will always return undefined
export const equipDataSelectorFactory = memoize((equipId: number) =>
  arrayResultWrapper(
    createSelector([equipBaseDataSelectorFactory(equipId), constSelector], (equip, { $equips }) => {
      if (!equip || !$equips || equip.api_slotitem_id == null || !$equips[equip.api_slotitem_id])
        return
      return [equip, $equips[equip.api_slotitem_id]] as [Equip, APIMstSlotitem]
    }),
  ),
)

const modifiedEquipDataSelectorFactory = memoize((equipId: number) =>
  arrayResultWrapper<StateWithOnslot, EquipDataWithOnslot | undefined>(
    createSelector(
      [
        (state: StateWithOnslot) => equipBaseDataSelectorFactory(equipId)(state.state),
        (state: StateWithOnslot) => constSelector(state.state),
        (state: StateWithOnslot) => state.onslot,
      ],
      (equip, { $equips }, onslot) => {
        if (!equip || !$equips || equip.api_slotitem_id == null || !$equips[equip.api_slotitem_id])
          return
        return [equip, $equips[equip.api_slotitem_id], onslot] as EquipDataWithOnslot
      },
    ),
  ),
)

function effectiveEquips<T>(equipArray: T[], slotnum: number): T[] {
  equipArray.splice(slotnum, equipArray.length - slotnum - 1)
  return equipArray
}

// Returns [[_equip, $equip, onslot] for each slot on the ship]
//   where onslot is the number of airplanes left as in api_onslot
// length is always slotnum+1, which is all slots plus exslot
// onslots (length 5) is padded with a 0 since onslot for exslot is assumed to be 0
// Slot is padded with undefined for being empty or not fount in _equips
// Returns undefined if _equips or $equips is undefined
export const shipEquipDataSelectorFactory = memoize((shipId: number) =>
  arrayResultWrapper(
    createSelector(
      [
        stateSelector,
        shipSlotnumSelectorFactory(shipId),
        shipEquipsIdSelectorFactory(shipId),
        shipOnSlotSelectorFactory(shipId),
      ],
      (state, slotnum, shipEquipsId, onslots) =>
        !Array.isArray(shipEquipsId)
          ? undefined
          : effectiveEquips(
              zip(shipEquipsId, (onslots ?? []).concat(0)).map(([equipId, onslot]) =>
                !equipId || equipId <= 0
                  ? undefined
                  : modifiedEquipDataSelectorFactory(equipId)({ state, onslot }),
              ),
              slotnum,
            ).filter((data): data is EquipDataWithOnslot => data !== undefined),
    ),
  ),
)

export const landbaseEquipDataSelectorFactory = memoize((landbaseId: number) =>
  arrayResultWrapper(
    createSelector(
      [
        stateSelector,
        landbaseSlotnumSelectorFactory(landbaseId),
        landbaseEquipsIdSelectorFactory(landbaseId),
        landbaseOnSlotSelectorFactory(landbaseId),
      ],
      (state, slotnum, landbaseEquipsId, onslots) =>
        !Array.isArray(landbaseEquipsId)
          ? undefined
          : effectiveEquips(
              zip(landbaseEquipsId, onslots).map(([equipId, onslot]) =>
                !equipId || equipId <= 0
                  ? undefined
                  : modifiedEquipDataSelectorFactory(equipId)({ state, onslot }),
              ),
              slotnum,
            ).filter((data): data is EquipDataWithOnslot => data !== undefined),
    ),
  ),
)

// Return [map, $map] or undefined
export const mapDataSelectorFactory = memoize((mapId: number | string) =>
  arrayResultWrapper(
    createSelector([mapsSelector, constSelector], (maps, { $maps }) => {
      const numericId = Number(mapId)
      if (Number.isNaN(numericId) || !maps[numericId] || !$maps?.[numericId]) return
      return [maps[numericId], $maps[numericId]] as MapData
    }),
  ),
)

export const sortieMapIdSelector = createSelector(sortieSelector, (sortie) => sortie.sortieMapId)
export const sortieMapDataSelector = createSelector(
  [sortieMapIdSelector, mapsSelector, constSelector],
  (mapId, maps, { $maps }) => getMapData(mapId, maps, $maps),
)
export const sortieMapHpSelector = createSelector(sortieMapDataSelector, (mapData) =>
  mapData ? getMapHp(mapData[0], mapData[1]) : undefined,
)
export const sortieMapEnemySelector = createSelector(
  sortieSelector,
  (sortie) => sortie.nextEnemyInfo,
)

// Returns [ [_ship, $ship] for ship in thisFleet]
// See fleetShipsDataSelectorFactory for detail
// A ship not found in _ships is filled with []
// A ship not found in $ships is filled with [_ship, undefined]
export const fleetShipsDataSelectorFactory = memoize((fleetId: number) =>
  arrayResultWrapper(
    createSelector([stateSelector, fleetShipsIdSelectorFactory(fleetId)], (state, fleetShipsId) =>
      !fleetShipsId
        ? undefined
        : fleetShipsId.map((shipId) => shipDataSelectorFactory(shipId)(state)),
    ),
  ),
)

// Returns [ [_equip, $equip] for ship in thisFleet]
// See shipDataToEquipData
export const fleetShipsEquipDataSelectorFactory = memoize((fleetId: number) =>
  arrayResultWrapper(
    createSelector([stateSelector, fleetShipsIdSelectorFactory(fleetId)], (state, fleetShipsId) =>
      !fleetShipsId
        ? undefined
        : fleetShipsId.map((shipId) => shipEquipDataSelectorFactory(shipId)(state)),
    ),
  ),
)

// excludes escaped ships
export const fleetShipsDataWithEscapeSelectorFactory = memoize((fleetId: number) =>
  arrayResultWrapper(
    createSelector([stateSelector, fleetShipsIdSelectorFactory(fleetId)], (state, fleetShipsId) =>
      !fleetShipsId
        ? undefined
        : fleetShipsId
            .filter((shipId) => !escapeStatusSelectorFactory(shipId)(state))
            .map((shipId) => shipDataSelectorFactory(shipId)(state))
            .filter((data): data is ShipData => data !== undefined),
    ),
  ),
)

export const fleetShipsEquipDataWithEscapeSelectorFactory = memoize((fleetId: number) =>
  arrayResultWrapper(
    createSelector([stateSelector, fleetShipsIdSelectorFactory(fleetId)], (state, fleetShipsId) =>
      !fleetShipsId
        ? undefined
        : fleetShipsId
            .filter((shipId) => !escapeStatusSelectorFactory(shipId)(state))
            .map((shipId) => shipEquipDataSelectorFactory(shipId)(state))
            .filter((data): data is EquipDataWithOnslot[] => data !== undefined),
    ),
  ),
)

export const allCVEIdsSelector = createSelector(constSelector, (c) =>
  values(get(c, '$ships'))
    .filter(
      (x) =>
        // our ships
        x.api_id <= 1500 &&
        // must be CVL
        x.api_stype === 7 &&
        // have ASW stat
        Array.isArray(x.api_tais) &&
        // in case Tanaka happens
        x.api_tais[0] > 0,
    )
    .map((x) => x.api_id),
)

/*
   returns:

   {
     remodelChains: Array<Array<MstId>>,
     originMstIdOf: Array<OriginMstId>,
   }

   (MstId = Int, OriginMstId = string)

   - note that only master id of non-abyssal units (mstId <= 1500)
     are considered valid.
   - OriginMstId is of string type,
     but for the purpose of index into remodelChains this does not make a difference
   - get original master id by originMstIdOf[<MstId>] = <OriginMstId>
     which is the original form of the ship
   - get remodel chains through remodelChains[<OriginMstId>]: Array<MstId>, in which master ids are sorted
     in the order of remodeling.

 */
export const shipRemodelInfoSelector = createSelector(constSelector, ({ $ships }) => {
  if (!$ships) return { remodelChains: {}, originMstIdOf: {} }

  // master id of all non-abyssal ships
  const mstIds = values($ships)
    .map((x) => x.api_id)
    .filter((x) => x <= 1500)
  // set of masterIds that has some other ship pointing to it (through remodeling)
  const afterMstIdSet = new Set<number>()

  mstIds.forEach((mstId) => {
    const $ship = $ships[mstId]
    if (!$ship) return
    const afterMstId = Number($ship.api_aftershipid)
    if (afterMstId !== 0) afterMstIdSet.add(afterMstId)
  })

  // all those that has nothing pointing to them are originals
  const originMstIds = mstIds.filter((mstId) => !afterMstIdSet.has(mstId))

  // chase remodel chain until we either reach an end or hit a loop
  const searchRemodels = (mstId: number, results: number[] = []): number[] => {
    if (results.includes(mstId)) return results

    const newResults = [...results, mstId]
    const $ship = $ships[mstId]
    const afterMstId = Number(get($ship, 'api_aftershipid', 0))
    if (afterMstId !== 0) {
      return searchRemodels(afterMstId, newResults)
    } else {
      return newResults
    }
  }

  /*
       remodelChains[originMstId] = <RemodelChain>

       - originMstId: master id of the original ship
       - RemodelChain: an Array of master ids, sorted by remodeling order.
     */
  const remodelChains: Record<number, number[]> = fromPairs(
    originMstIds.map((originMstId) => {
      return [originMstId, searchRemodels(originMstId)]
    }),
  )

  const shipsInChain = new Set<number>()
  for (const chain of Object.values(remodelChains)) {
    chain.forEach((item) => shipsInChain.add(item))
  }
  // Master IDs that are not contained in the remodel chain.
  // This is (for now) because some ships does not have originMstId.
  // Here, we take the ascending order and assume the ship with least MstID is the original ship.
  // This might not be the case in the future whenever Tanaka found appropriate.
  let missingMstId = Array.from(
    new Set([...mstIds].filter((element) => !shipsInChain.has(element))),
  ).sort((a, b) => a - b)
  while (missingMstId.length > 0) {
    // Choose the one with least Master ID
    const originMstId = missingMstId[0]
    remodelChains[originMstId] = searchRemodels(originMstId)
    // Remove all master IDs along the newly found chain from missingMstId
    missingMstId = missingMstId.filter((element) => !remodelChains[originMstId].includes(element))
  }

  // originMstIdOf[<master id>] = <original master id>
  const originMstIdOf: Record<number, number | string> = {}
  Object.entries(remodelChains).forEach(([originMstId, remodelChain]) => {
    remodelChain.forEach((mstId) => {
      originMstIdOf[mstId] = originMstId
    })
  })
  return { remodelChains, originMstIdOf }
})
