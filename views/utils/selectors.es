import memoize from 'fast-memoize'
import { get, map, range, zip } from 'lodash'
import { createSelector, createSelectorCreator, defaultMemoize } from 'reselect'

//### Helpers ###

function deepCompareArray(currentVal, previousVal) {
  if (Array.isArray(currentVal) && Array.isArray(previousVal)
    && currentVal.length === previousVal.length) {
    return zip(currentVal, previousVal).every(([a, b]) => a === b)
  } else {
    return currentVal === previousVal
  }
}
// This kind of selector specially treats array arguments by `===` comparing
// its items one by one
const createDeepCompareArraySelector = createSelectorCreator(
  defaultMemoize,
  deepCompareArray
)

function shipIdToShipData(shipId, ships, $ships) {
  if (shipId == null || ships == null || $ships == null)
    return
  if (shipId == -1)
    return
  const ship = ships[shipId]
  if (!ship || !ship.api_ship_id)
    return
  const $ship = $ships[ship.api_ship_id]
  return [ship, $ship]
}

function equipIdToEquipData(equipId, equips, $equips) {
  if (equipId == null || equips == null || $equips == null)
    return
  if (equipId == -1)
    return
  const equip = equips[equipId]
  if (!equip || !equip.api_slotitem_id)
    return
  const $equip = $equips[equip.api_slotitem_id]
  return [equip, $equip]
}

function shipDataToEquipData(shipData, equips, $equips) {
  if (shipData == null || equips == null || $equips == null)
    return
  if (shipData.length == 0)
    return []
  const {api_slot, api_onslot, api_slot_ex, api_slotnum} = shipData[0]
  const equipsId = api_slot.slice(0, api_slotnum).concat(api_slot_ex)
  return equipsId.map((equipId, i) => {
    const equipData = equipIdToEquipData(equipId, equips, $equips)
    const onslot = (i == api_slotnum) ? 0 : (api_onslot[i])
    return equipData ? equipData.concat(onslot) : undefined
  })
}

function getDeckState(shipsData, inBattle, inExpedition, inRepairShipsId) {
  let state = 0
  if (inBattle)
    state = Math.max(state, 5)
  if (inExpedition)
    state = Math.max(state, 4)
  for (const [ship, $ship] of shipsData) {
    if (!ship || !$ship)
      continue
    // Cond < 20 or medium damage
    if (ship.api_cond < 20 || ship.api_nowhp / ship.api_maxhp < 0.25)
      state = Math.max(state, 2)
    // Cond < 40 or heavy damage
    else if (ship.api_cond < 40 || ship.api_nowhp / ship.api_maxhp < 0.5)
      state = Math.max(state, 1)
    // Not supplied
    if (ship.api_fuel / $ship.api_fuel_max < 0.99 || ship.api_bull / $ship.api_bull_max < 0.99)
      state = Math.max(state, 1)
    // Repairing
    if (inRepairShipsId.includes(ship.api_id))
      state = Math.max(state, 3)
  }
  return state
}

function getMapData(mapId, maps, $maps) {
  if (mapId == 0 || mapId == null || maps == null || $maps == null)
    return
  if (!maps[mapId] || !$maps[mapId])
    return
  return [maps[mapId], $maps[mapId]]
}

function getMapHp(map, $map) {
  if (!map || !$map)
    return
  if (map.api_eventmap) {
    const {api_now_maphp, api_max_maphp, api_gauge_type} = map.api_eventmap
    return [api_now_maphp, api_max_maphp, api_gauge_type]
  }
  const maxHp = $map.api_required_defeat_count
  if (!maxHp)
    return
  const nowHp = map.api_defeat_count || 0
  return [nowHp, maxHp, undefined]
}

//### Selectors ###
// Use it sparingly
export const stateSelector = (state) => state

export const constSelector = (state) => state.const
export const basicSelector = (state) => state.info.basic
export const configSelector = (state) => state.config
export const fleetsSelector = (state) => state.info.fleets
export const shipsSelector = (state) => state.info.ships
export const equipsSelector = (state) => state.info.equips
export const repairsSelector = (state) => state.info.repairs
export const mapsSelector = (state) => state.info.maps
export const sortieSelector = (state) => state.sortie
export const sortieStatusSelector = (state) => state.sortie.sortieStatus

export const extensionSelectorFactory = (key) =>
  (state) => state.ext[key]

export const configLayoutSelector = createSelector(configSelector,
  (config) => get(config, 'poi.layout', 'horizontal'))
export const configDoubleTabbedSelector = createSelector(configSelector,
  (config) => get(config, 'poi.tabarea.double', false))

export const condTimerSelector = (state) => state.timers.cond

// Returns [shipId for every ship in repair]
// Returns undefined if uninitialized
export const inRepairShipsIdSelector = createSelector(repairsSelector, (repairs) => {
  if (!repairs)
    return
  return map(repairs.filter((repair) => parseInt(repair.api_state) == 1), 'api_ship_id')
})


export const fleetSelectorFactory = memoize((fleetId) => 
  createSelector(fleetsSelector, (fleets) => {
    return (fleets || [])[fleetId]
  })
)

const fleetShipsIdRawSelectorFactory = memoize((fleetId) => 
  createSelector(fleetSelectorFactory(fleetId), (fleet) => {
    if (fleet == null)
      return
    return fleet.api_ship
  })
)
// Returns [shipId] of this fleet
// Returns undefined if fleet not found
export const fleetShipsIdSelectorFactory = memoize((fleetId) => 
  createSelector(fleetShipsIdRawSelectorFactory(fleetId), (shipsId) => {
    if (shipsId == null)
      return
    return shipsId.filter((n) => n != -1)
  })
)

export const fleetInBattleSelectorFactory = memoize((fleetId) => 
  createSelector(sortieStatusSelector, (sortieStatus) => sortieStatus[fleetId])
)
export const fleetInExpeditionSelectorFactory = memoize((fleetId) => 
  createSelector(fleetSelectorFactory(fleetId),
    (fleet) => typeof fleet === 'object' ? fleet.api_mission[0] : false)
)
export const fleetNameSelectorFactory = memoize((fleetId) => 
  createSelector(fleetSelectorFactory(fleetId),
    (fleet) => typeof fleet === 'object' ? fleet.api_name : '')
)
export const fleetStateSelectorFactory = memoize((fleetId) =>
  createSelector([
    fleetInBattleSelectorFactory(fleetId),
    fleetInExpeditionSelectorFactory(fleetId),
    inRepairShipsIdSelector,
    fleetShipsDataSelectorFactory(fleetId),
  ], (inBattle, inExpedition, inRepairShipsId, shipsData) =>
    getDeckState(shipsData, inBattle, inExpedition, inRepairShipsId),
  )
)

const emptyExpedition = [0, 0, 0, 0]
export const fleetExpeditionSelectorFactory = memoize((fleetId) =>
  createSelector(fleetSelectorFactory(fleetId),
    (fleet) => 
      fleet ? fleet.api_mission : emptyExpedition
  )
)

// Reads props.fleetId
// Returns <repairDock> if this ship is in repair
// Returns undefined if uninitialized or not in repair
export const shipRepairDockSelectorFactory = memoize((shipId) =>
  createSelector(repairsSelector, (repairs) => {
    if (repairs == null)
      return
    return repairs.find(({api_state, api_ship_id}) =>
      api_state == 1 && api_ship_id == shipId)
  })
)

const shipBaseDataSelectorFactory = memoize((shipId) =>
  createSelector([
    shipsSelector,
  ], (ships) =>
    ships && typeof shipId === 'number' && shipId
    ? ships[shipId]
    : undefined
  )
)
// Reads props.shipId
// Returns [_ship, $ship]
// Returns undefined if uninitialized, or if ship not found in _ship
export const shipDataSelectorFactory = memoize((shipId) =>
  createSelector([
    shipBaseDataSelectorFactory(shipId),
    constSelector,
  ], (ship, {$ships}) =>
    $ships && typeof ship === 'object' && ship
    ? [ship, $ships[ship.api_ship_id]]
    : undefined
  )
)

const shipSlotnumSelectorFactory = memoize((shipId) => 
  createSelector(shipBaseDataSelectorFactory(shipId), (ship) => ship ? ship.api_slotnum : 0))
const shipSlotSelectorFactory = memoize((shipId) => 
  createSelector(shipBaseDataSelectorFactory(shipId), (ship) => ship ? ship.api_slot : undefined))
const shipExslotSelectorFactory = memoize((shipId) => 
  createSelector(shipBaseDataSelectorFactory(shipId), (ship) => ship ? ship.api_slot_ex : -1))
const shipOnSlotSelectorFactory = memoize((shipId) => 
  createSelector(shipBaseDataSelectorFactory(shipId), (ship) => ship ? ship.api_onslot : undefined))
// Returns [equipId for each slot on the ship]
// length is always slotnum+1, which is all slots plus exslot
// Slot is padded with -1 for each empty slot
// Returns undefined if ship is undefined
const shipEquipsIdSelectorFactory = memoize((shipId) =>
  createSelector([
    shipSlotnumSelectorFactory(shipId),
    shipSlotSelectorFactory(shipId),
    shipExslotSelectorFactory(shipId),
  ], (slotnum, slot, exslot) =>
    slot ? slot.slice(0, slotnum).concat(exslot).map((i) => parseInt(i)) : undefined
  )
)

const shipEquipsBaseDataSelectorFactory = memoize((shipId) =>
  createDeepCompareArraySelector([
    shipEquipsIdSelectorFactory(shipId),
    equipsSelector,
  ], (shipEquipsId, equips) =>
    equips && shipEquipsId
    ? shipEquipsId.map((i) => i === -1 ? undefined : equips[i])
    : undefined
  )
)

// Returns [[_equip, $equip, onslot] for each slot on the ship]
//   where onslot is the number of airplanes left as in api_onslot
// length is always slotnum+1, which is all slots plus exslot
// Slot is padded with undefined for being empty or not fount in _equips
// Slot is [_equip] for those not found in $equips
// Returns undefined if anything is undefined
export const shipEquipDataSelectorFactory = memoize((shipId) => 
  createDeepCompareArraySelector([
    shipSlotnumSelectorFactory(shipId),
    shipEquipsBaseDataSelectorFactory(shipId),
    shipOnSlotSelectorFactory(shipId),
    constSelector,
  ], (slotnum, shipEquipsList, onslots, {$equips}) =>
    !Array.isArray(shipEquipsList)
    ? undefined
    : zip(
      shipEquipsList,
      onslots.slice(0, slotnum).concat(onslots[onslots.length-1])
    ).map(([equip, onslot]) =>
      typeof equip === 'object' && equip
      ? [equip, $equips[equip.api_slotitem_id], onslot]
      : undefined
    )
  )
)

// Return [map, $map] or undefined
export const mapDataSelectorFactory = memoize((mapId) =>
  createSelector([
    mapsSelector,
    constSelector,
  ], (maps, {$maps}) => {
    if (!maps[mapId] || !$maps[mapId])
      return
    return [maps[mapId], $maps[mapId]]
  })
)

export const sortieMapIdSelector = createSelector(sortieSelector,
  (sortie) => sortie.sortieMapId
)
export const sortieMapDataSelector = createSelector([
  sortieMapIdSelector,
  mapsSelector,
  constSelector,
], (mapId, maps, {$maps}) =>
  getMapData(mapId, maps, $maps)
)
export const sortieMapHpSelector = createSelector(sortieMapDataSelector,
  (mapData) =>
    mapData ? getMapHp(mapData[0], mapData[1]) : undefined
)

// Return undefined if doesn't have a gauge, or $map does not exist
// Return [nowHp, maxHp, gaugeType], where nowHp == 0 means defeated
// Where gaugeType = undefined   // Normal maps
//                 = 2           // HP
//                 = 3           // Transpotation

// fleetId: 0, .., 3
// idx: 0, .., 5
// Returns shipId or undefined
const fleetIdxShipIdSelectorFactory = memoize((fleetId, idx) =>
  createSelector(fleetShipsIdSelectorFactory(fleetId), (shipsId) =>
    shipsId ? shipsId[idx] : undefined
  )
)
// Returns [ship, $ship] or undefined
const fleetIdxShipDataSelectorFactory = memoize((fleetId, idx) =>
  createSelector([
    fleetIdxShipIdSelectorFactory(fleetId, idx),
    stateSelector,
  ], (shipId, state) =>
    shipId ? shipDataSelectorFactory(shipId)(state) : undefined
  )
)
// Returns [equip, $equip] or undefined, see shipDataToEquipData
const fleetIdxEquipDataSelectorFactory = memoize((fleetId, idx) =>
  createSelector([
    fleetIdxShipIdSelectorFactory(fleetId, idx),
    stateSelector,
  ], (shipId, state) =>
    shipId ? shipEquipDataSelectorFactory(shipId)(state) : undefined
  )
)

// Returns [ [_ship, $ship] for ship in thisFleet]
// See fleetShipsDataSelectorFactory for detail
// A ship not found in _ships is filled with []
// A ship not found in $ships is filled with [_ship, undefined]
export const fleetShipsDataSelectorFactory = memoize((fleetId) =>
  createSelector(range(6).map(
    (idx) => fleetIdxShipDataSelectorFactory(fleetId, idx)
  ), (...args) =>
    args.filter((arr) => arr && arr.length)
  )
)

// Returns [ [_equip, $equip] for ship in thisFleet]
// See shipDataToEquipData
export const fleetShipsEquipDataSelectorFactory = memoize((fleetId) =>
  createSelector(range(6).map(
    (idx) => fleetIdxEquipDataSelectorFactory(fleetId, idx)
  ), (...args) =>
    args.filter((arr) => arr && arr.length)
  )
)
