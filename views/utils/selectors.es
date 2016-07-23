import memoize from 'fast-memoize'
import { get, map } from 'lodash'
import { createSelector } from 'reselect'

//### Helpers ###
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

function fleetToShipsData(fleet, ships, $ships) {
  if (fleet == null || !Array.isArray(fleet.api_ship))
    return
  return fleet.api_ship.map((shipId) => shipIdToShipData(shipId, ships, $ships)).filter(Boolean)
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

//### Selectors ###
// Do not export. Use it sparingly
const stateSelector = (state) => state

export const constSelector = (state) => state.const
export const basicSelector = (state) => state.info.basic
export const configSelector = (state) => state.config
export const fleetsSelector = (state) => state.info.fleets
export const shipsSelector = (state) => state.info.ships
export const equipsSelector = (state) => state.info.equips
export const repairsSelector = (state) => state.info.repairs
export const sortieStatusSelector = (state) => state.sortie.sortieStatus

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

// Returns [shipId] of this fleet
// Returns undefined if fleet not found
export const fleetShipsIdSelectorFactory = memoize((fleetId) => 
  createSelector(fleetSelectorFactory(fleetId), (fleet) => {
    if (fleet == null)
      return
    return fleet.api_ship.filter((n) => n != -1)
  })
)

// Returns [ [_ship, $ship] for ship in thisFleet]
// See thisFleetShipsDataSelector for detail
// A ship not found in _ships is filled with []
// A ship not found in $ships is filled with [_ship, undefined]
export const fleetShipsDataSelectorFactory = memoize((fleetId) =>
  createSelector([
    fleetSelectorFactory(fleetId),
    shipsSelector,
    constSelector,
  ], (fleet, ships, {$ships}) => {
    return fleetToShipsData(fleet, ships, $ships)
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

export const fleetShipsEquipDataSelectorFactory = memoize((fleetId) =>
  createSelector([
    stateSelector,
    fleetShipsIdSelectorFactory(fleetId),
  ], (state, shipsId) => 
    shipsId.map((shipId) => shipEquipDataSelectorFactory(shipId)(state))
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

// Reads props.shipId
// Returns [_ship, $ship]
// Returns undefined if uninitialized, or if ship not found in _ship
export const shipDataSelectorFactory = memoize((shipId) =>
  createSelector([
    shipsSelector,
    constSelector,
  ], (ships, {$ships}) =>
    shipIdToShipData(shipId, ships, $ships)
  )
)

// Returns [[_equip, $equip, onslot] for each slot on the ship]
//   where onslot is the number of airplanes left as in api_onslot
// length is always slotnum+1, which is all slots plus exslot
// Slot is padded with undefined for each empty slot
// Slot is [_equip] for those not found in $equips
// Returns undefined if anything is undefined
export const shipEquipDataSelectorFactory = memoize((shipId) => 
  createSelector([
    shipDataSelectorFactory(shipId),
    equipsSelector,
    constSelector,
  ], (shipData, equips, {$equips}) =>
    shipDataToEquipData(shipData, equips, $equips)
  )
)
