import memoize from 'fast-memoize'
import { get, map, zip, flatMap, values } from 'lodash'
import { createSelector, createSelectorCreator, defaultMemoize } from 'reselect'

//### Helpers ###

function deepCompareArray(currentVal, previousVal) {
  if (currentVal === previousVal)
    return true
  if (Array.isArray(currentVal) && Array.isArray(previousVal)
    && currentVal.length === previousVal.length) {
    return zip(currentVal, previousVal).every(([a, b]) => a === b)
  } else {
    return false
  }
}
// This kind of selector specially treats array arguments by `===` comparing
// its items one by one
export const createDeepCompareArraySelector = createSelectorCreator(
  defaultMemoize,
  deepCompareArray
)

// This wrapper prevents different array (in terms of ===) being returned
// despite having the same elements
function arrayResultWrapper(selector) {
  return createDeepCompareArraySelector(selector, (result) => result)
}

function getDeckState(shipsData=[], inBattle, inExpedition, inRepairShipsId) {
  let state = 0
  if (inBattle)
    state = Math.max(state, 5)
  if (inExpedition)
    state = Math.max(state, 4)
  shipsData.forEach(([ship, $ship]=[]) => {
    if (!ship || !$ship)
      return
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
  })
  return state
}

function getMapData(mapId, maps, $maps) {
  if (mapId == 0 || mapId == null || maps == null || $maps == null)
    return
  if (!maps[mapId] || !$maps[mapId])
    return
  return [maps[mapId], $maps[mapId]]
}

// Returns [nowHp, maxHp, gaugeType]
// where nowHp === 0 means cleared
function getMapHp(map, $map) {
  if (!map || !$map)
    return
  if (map.api_eventmap) {
    const {api_now_maphp, api_max_maphp, api_gauge_type} = map.api_eventmap
    return [api_now_maphp, api_max_maphp, api_gauge_type]
  }
  const maxCount = $map.api_required_defeat_count
  if (!maxCount)
    return
  const nowCount = map.api_defeat_count || maxCount
  const nowHp = maxCount - nowCount
  return [nowHp, maxCount, undefined]
}

//### Selectors ###
// Use it sparingly
export const stateSelector = (state) => state

export const constSelector = (state) => state.const
export const basicSelector = (state) => state.info.basic
export const configSelector = (state) => state.config
export const miscSelector = (state) => state.misc
export const fleetsSelector = (state) => state.info.fleets
export const shipsSelector = (state) => state.info.ships
export const equipsSelector = (state) => state.info.equips
export const repairsSelector = (state) => state.info.repairs
export const mapsSelector = (state) => state.info.maps
export const sortieSelector = (state) => state.sortie
export const sortieStatusSelector = (state) => state.sortie.sortieStatus
export const currentNodeSelector = (state) => state.sortie.currentNode
export const battleSelector = (state) => state.battle
export const fcdSelector = (state) => state.fcd
export const ipcSelector = state => state.ipc
export const wctfSelector = state => state.wctf
export const layoutSelector = state => state.layout

export const extensionSelectorFactory = key =>
  state => get(state.ext, [key, '_']) || {}

export const configLayoutSelector = createSelector(configSelector,
  config => get(config, 'poi.layout', 'horizontal'))
export const configDoubleTabbedSelector = createSelector(configSelector,
  config => get(config, 'poi.tabarea.double', false))
export const configZoomLevelSelector = createSelector(configSelector,
  config => get(config, 'poi.zoomLevel', 1))
export const configReverseLayoutSelector = createSelector(configSelector,
  config => get(config, 'poi.reverseLayout', false))


export const condTickSelector = (state) => state.timers.cond.tick

// Returns [shipId for every ship in repair]
// Returns undefined if uninitialized
export const inRepairShipsIdSelector = arrayResultWrapper(createSelector(repairsSelector,
  (repairs) => {
    if (!repairs)
      return
    return map(repairs.filter((repair) => repair.api_state == 1), 'api_ship_id')
  }
))


export const fleetSelectorFactory = memoize((fleetId) =>
  (state) => (state.info.fleets || [])[fleetId]
)
export const landbaseSelectorFactory = memoize(landbaseId => state => (state.info.airbase || [])[landbaseId])

// Returns [shipId] of this fleet
// Returns undefined if fleet not found
export const fleetShipsIdSelectorFactory = memoize((fleetId) =>
  arrayResultWrapper(createSelector(fleetSelectorFactory(fleetId), (fleet) => {
    if (fleet == null)
      return
    return fleet.api_ship.filter((n) => n != -1)
  }))
)

export const fleetSlotCountSelectorFactory = memoize((fleetId) => createSelector(
  [
    fleetSelectorFactory(fleetId),
  ], fleet => get(fleet, 'api_ship.length', 0)
))

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

// Selector for all ship ids that in sortie, including the -1 placeholders
const sortieShipIdSelector = arrayResultWrapper(createSelector(
  [
    fleetsSelector, // we need the -1 placeholder here because escapedPos is by index
    sortieSelector,
  ], (fleet, { sortieStatus }) => flatMap(sortieStatus, (sortie, index) =>
    sortie ? get(fleet, [index, 'api_ship'], []) : []
  )
))

export const escapeStatusSelectorFactory = memoize((shipId) =>
  createSelector([
    sortieShipIdSelector,
    sortieSelector,
  ], (sortieShipIds, {escapedPos}) =>
    shipId > 0 && escapedPos.some(pos => sortieShipIds[pos] === shipId)
  )
)

// There's a Number type check
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
// Attention: shipId here only accepts Number type,
//   otherwise will always return undefined
export const shipDataSelectorFactory = memoize((shipId) =>
  arrayResultWrapper(createSelector([
    shipBaseDataSelectorFactory(shipId),
    constSelector,
  ], (ship, {$ships}) =>
    $ships && typeof ship === 'object' && ship
      ? [ship, $ships[ship.api_ship_id]]
      : undefined
  ))
)


const shipSlotnumSelectorFactory = memoize((shipId) =>
  createSelector(shipBaseDataSelectorFactory(shipId), (ship) => ship ? ship.api_slotnum : 0))
const shipSlotSelectorFactory = memoize((shipId) =>
  createSelector(shipBaseDataSelectorFactory(shipId), (ship) => ship ? ship.api_slot : undefined))
const shipExslotSelectorFactory = memoize((shipId) =>
  createSelector(shipBaseDataSelectorFactory(shipId), (ship) => ship ? ship.api_slot_ex : -1))
const shipOnSlotSelectorFactory = memoize((shipId) =>
  createSelector(shipBaseDataSelectorFactory(shipId), (ship) => ship ? ship.api_onslot : undefined))
const landbaseSlotnumSelectorFactory = memoize(landbaseId =>
  createSelector(landbaseSelectorFactory(landbaseId), landbase => landbase ? landbase.api_plane_info.length : 0))
const landbaseOnSlotSelectorFactory = memoize((landbaseId) =>
  createSelector(landbaseSelectorFactory(landbaseId), landbase => landbase ? landbase.api_plane_info.map(l => l.api_count) : undefined))
// Returns [equipId for each slot on the ship]
// length is always 5 + 1(ex slot)
// Slot is padded with -1 for each empty slot
// Returns undefined if ship is undefined
const shipEquipsIdSelectorFactory = memoize((shipId) =>
  arrayResultWrapper(createSelector([
    shipSlotSelectorFactory(shipId),
    shipExslotSelectorFactory(shipId),
  ], (slot, exslot) =>
    slot ? slot.concat(exslot).map((i) => parseInt(i)) : undefined
  ))
)
const landbaseEquipsIdSelectorFactory = memoize(landbaseId =>
  arrayResultWrapper(
    createSelector(
      landbaseSelectorFactory(landbaseId),
      landbase => landbase ? landbase.api_plane_info.map(l => l.api_slotid) : [])))

// There's a Number type check
const equipBaseDataSelectorFactory = memoize((equipId) =>
  createSelector([
    equipsSelector,
  ], (equips) =>
    equips && typeof equipId === 'number' && equipId
      ? equips[equipId]
      : undefined
  )
)

// Returns [_equip, $equip]
// Returns undefined if uninitialized, or if equip not found in _equip
// Attention: equipId here only accepts Number type,
//   otherwise will always return undefined
export const equipDataSelectorFactory = memoize((equipId) =>
  arrayResultWrapper(createSelector([
    equipBaseDataSelectorFactory(equipId),
    constSelector,
  ], (equip, {$equips}) => {
    if (!equip || !$equips || !$equips[equip.api_slotitem_id])
      return
    return [equip, $equips[equip.api_slotitem_id]]
  })
  )
)

const modifiedEquipDataSelectorFactory = memoize((equipId) =>
  arrayResultWrapper(createSelector([
    (state) => equipBaseDataSelectorFactory(equipId)(state.state),
    (state) => constSelector(state.state),
    (state) => state.onslot,
  ], (equip, {$equips}, onslot) => {
    if (!equip || !$equips || !$equips[equip.api_slotitem_id])
      return
    return [equip, $equips[equip.api_slotitem_id], onslot]
  })
  )
)

function effectiveEquips(equipArray, slotnum) {
  equipArray.splice(slotnum, equipArray.length - slotnum - 1)
  return equipArray
}

// Returns [[_equip, $equip, onslot] for each slot on the ship]
//   where onslot is the number of airplanes left as in api_onslot
// length is always slotnum+1, which is all slots plus exslot
// onslots (length 5) is padded with a 0 since onslot for exslot is assumed to be 0
// Slot is padded with undefined for being empty or not fount in _equips
// Returns undefined if _equips or $equips is undefined
export const shipEquipDataSelectorFactory = memoize((shipId) =>
  arrayResultWrapper(createSelector([
    stateSelector,
    shipSlotnumSelectorFactory(shipId),
    shipEquipsIdSelectorFactory(shipId),
    shipOnSlotSelectorFactory(shipId),
  ], (state, slotnum, shipEquipsId, onslots) =>
    !Array.isArray(shipEquipsId)
      ? undefined
      : effectiveEquips(
        zip(shipEquipsId, onslots.concat(0)).map(([equipId, onslot]) =>
          equipId <= 0
            ? undefined
            : modifiedEquipDataSelectorFactory(equipId)({ state, onslot })
        ), slotnum
      )
  ))
)

export const landbaseEquipDataSelectorFactory = memoize(landbaseId =>
  arrayResultWrapper(createSelector([
    stateSelector,
    landbaseSlotnumSelectorFactory(landbaseId),
    landbaseEquipsIdSelectorFactory(landbaseId),
    landbaseOnSlotSelectorFactory(landbaseId),
  ], (state, slotnum, landbaseEquipsId, onslots) =>
    !Array.isArray(landbaseEquipsId)
      ? undefined
      : effectiveEquips(
        zip(landbaseEquipsId, onslots).map(([equipId, onslot]) =>
          equipId <= 0
            ? undefined
            : modifiedEquipDataSelectorFactory(equipId)({ state, onslot })
        ), slotnum
      )
  ))
)

// Return [map, $map] or undefined
export const mapDataSelectorFactory = memoize((mapId) =>
  arrayResultWrapper(createSelector([
    mapsSelector,
    constSelector,
  ], (maps, {$maps}) => {
    if (!maps[mapId] || !$maps[mapId])
      return
    return [maps[mapId], $maps[mapId]]
  }))
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

// Returns [ [_ship, $ship] for ship in thisFleet]
// See fleetShipsDataSelectorFactory for detail
// A ship not found in _ships is filled with []
// A ship not found in $ships is filled with [_ship, undefined]
export const fleetShipsDataSelectorFactory = memoize((fleetId) =>
  arrayResultWrapper(createSelector([
    stateSelector,
    fleetShipsIdSelectorFactory(fleetId),
  ], (state, fleetShipsId) =>
    !fleetShipsId ? undefined :
      fleetShipsId.map((shipId) => shipDataSelectorFactory(shipId)(state))
  ))
)

// Returns [ [_equip, $equip] for ship in thisFleet]
// See shipDataToEquipData
export const fleetShipsEquipDataSelectorFactory = memoize((fleetId) =>
  arrayResultWrapper(createSelector([
    stateSelector,
    fleetShipsIdSelectorFactory(fleetId),
  ], (state, fleetShipsId) =>
    !fleetShipsId ? undefined :
      fleetShipsId.map((shipId) => shipEquipDataSelectorFactory(shipId)(state))
  ))
)

// excludes escaped ships
export const fleetShipsDataWithEscapeSelectorFactory = memoize((fleetId) =>
  arrayResultWrapper(createSelector([
    stateSelector,
    fleetShipsIdSelectorFactory(fleetId),
  ], (state, fleetShipsId) =>
    !fleetShipsId ? undefined :
      fleetShipsId.filter(shipId =>
        !escapeStatusSelectorFactory(shipId)(state)
      ).map(shipId =>
        shipDataSelectorFactory(shipId)(state)
      )
  ))
)

export const fleetShipsEquipDataWithEscapeSelectorFactory = memoize((fleetId) =>
  arrayResultWrapper(createSelector([
    stateSelector,
    fleetShipsIdSelectorFactory(fleetId),
  ], (state, fleetShipsId) =>
    !fleetShipsId ? undefined :
      fleetShipsId.filter(shipId =>
        !escapeStatusSelectorFactory(shipId)(state)
      ).map(shipId =>
        shipEquipDataSelectorFactory(shipId)(state)
      )
  ))
)

export const allCVEIdsSelector = createSelector(
  constSelector,
  c => values(get(c, '$ships')).filter(x =>
    // our ships
    x.api_id <= 1500 &&
    // must be CVL
    x.api_stype === 7 &&
    // have ASW stat
    Array.isArray(x.api_tais) &&
    // in case Tanaka happens
    x.api_tais[0] > 0
  ).map(x => x.api_id)
)
