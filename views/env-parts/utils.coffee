{createSelector} = require 'reselect'
{map, get} = require 'lodash'

Object.clone = (obj) ->
  JSON.parse JSON.stringify obj
Object.remoteClone = (obj) ->
  JSON.parse remote.require('./lib/utils').remoteStringify obj

pad = (n) ->
  if n < 10 then "0#{n}" else n
window.resolveTime = (seconds) ->
  seconds = parseInt seconds
  if seconds >= 0
    s = seconds % 60
    m = Math.trunc(seconds / 60) % 60
    h = Math.trunc(seconds / 3600)
    "#{pad h}:#{pad m}:#{pad s}"
  else
    ''
window.timeToString = (milliseconds) ->
  date = new Date(milliseconds)
  date.toTimeString().slice(0, 8)  # HH:mm:ss

# Input: [[index, value], ...]
# Return: Array
window.buildArray = (pairs) => 
  ret = []
  pairs.forEach(([index, value]=[]) => 
    index = parseInt(index)
    if (isNaN(index) || index < 0)
      return
    ret[index] = value
  )
  return ret

# Not sure where this function should go, leave it here just for now, for easy access.
window.getCondStyle = (cond) ->
  s = 'poi-ship-cond-'
  if cond > 52
    s += '53'
  else if cond > 49
    s += '50'
  else if cond == 49
    s += '49'
  else if cond > 39
    s += '40'
  else if cond > 29
    s += '30'
  else if cond > 19
    s += '20'
  else
    s += '0'
  s += if isDarkTheme then ' dark' else ' light'

window.pickId = (collection={}, keys) ->
  res = {}
  for key in keys
    res[key] = collection[key]
  res

shipIdToShipData = (shipId, ships, $ships) ->
  return if !shipId? || !ships? || !$ships?
  return if shipId == -1
  ship = ships[shipId]
  return if !ship || !ship.api_ship_id
  $ship = $ships[ship.api_ship_id]
  [ship, $ship]

equipIdToEquipData = (equipId, equips, $equips) ->
  return if !equipId? || !equips? || !$equips?
  return if equipId == -1
  equip = equips[equipId]
  return if !equip || !equip.api_slotitem_id
  $equip = $equips[equip.api_slotitem_id]
  [equip, $equip]

fleetToShipsData = (fleet, ships, $ships) ->
  return if !fleet? || !Array.isArray(fleet.api_ship)
  fleet.api_ship.map((shipId) -> shipIdToShipData(shipId, ships, $ships)).filter(Boolean)

configSelector = window.configSelector = (state) -> state.config
fleetsSelector = window.fleetsSelector = (state) -> state.info?.fleets
shipsSelector = (state) -> state.info?.ships
window.constSelector = (state) -> state.const || {}
equipsSelector = (state) -> state.info?.equips
repairsSelector = (state) -> state.info?.repairs

window.sortieStatusSelector = (state) -> state.sortie?.sortieStatus
window.configLayoutSelector = createSelector configSelector, (config) ->
  get(config, 'poi.layout', 'horizontal')
window.configDoubleTabbedSelector = createSelector configSelector, (config) ->
  get(config, 'poi.tabarea.double', false)

# Returns [shipId for every ship in repair]
# Returns undefined if uninitialized
window.inRepairShipsIdSelector = createSelector repairsSelector, (repairs) ->
  return if !repairs
  map(repairs.filter((repair) -> parseInt(repair.api_state) == 1), 'api_ship_id')


## <thisFleet> Reads props.fleetId ##
makeThisFleetIdSelector = () -> (state, props) -> props.fleetId

window.makeThisFleetSelector = () -> createSelector [
    fleetsSelector,
    makeThisFleetIdSelector(),
  ], (fleets, fleetId) ->
    return if !fleets? || !fleetId?
    fleets[fleetId]

# Reads props.fleetId
# Returns [shipId] of this fleet
# Returns undefined if fleet not found
window.makeThisFleetShipsIdSelector = () -> createSelector [
    makeThisFleetSelector(),
  ], (fleet) ->
    return if !fleet?
    fleet.api_ship.filter (n) -> n != -1

# Returns [ [_ship, $ship] for ship in thisFleet]
# See thisFleetShipsDataSelector for detail
# A ship not found in _ships is filled with []
# A ship not found in $ships is filled with [_ship, undefined]
window.makeThisFleetShipsDataSelector = () -> createSelector [
    makeThisFleetSelector(),
    shipsSelector,
    constSelector,
  ], (fleet, ships, {$ships}) ->
    fleetToShipsData(fleet, ships, $ships)
    

## <thisShip> Reads props.shipId ##
makeThisShipIdSelector = () -> (state, props) -> props.shipId

# Reads props.fleetId
# Returns <repairDock> if this ship is in repair
# Returns undefined if uninitialized or not in repair
window.makeThisShipRepairDockSelector = () -> createSelector [
    makeThisShipIdSelector(),
    repairsSelector,
  ], (shipId, repairs) ->
    return if !repairs?
    (repairs.filter ({api_state, api_ship_id}) ->
      parseInt(api_state) == 1 && api_ship_id.toString() == shipId.toString())[0]

# Reads props.shipId
# Returns [_ship, $ship]
# Returns undefined if uninitialized, or if ship not found in _ship
window.makeThisShipDataSelector = () -> createSelector [
    makeThisShipIdSelector(),
    shipsSelector,
    constSelector,
  ], (shipId, ships, {$ships}) ->
    shipIdToShipData(shipId, ships, $ships)

# Reads props.shipId
# Returns [[_equip, $equip, onslot] for each slot on the ship]
#   where onslot is the number of airplanes left as in api_onslot
# length is always slotnum+1, which is all slots plus exslot
# Slot is padded with undefined for each empty slot
# Slot is [_equip] for those not found in $equips
# Returns undefined if anything is undefined
window.makeThisShipEquipDataSelector = () -> createSelector [
    makeThisShipDataSelector(),
    equipsSelector,
    constSelector,
  ], (shipData, equips, {$equips}) ->
    return if !shipData? || !equips? || !$equips?
    {api_slot, api_onslot, api_slot_ex, api_slotnum} = shipData[0]
    equipsId = api_slot[0...api_slotnum].concat(api_slot_ex)
    for equipId, i in equipsId
      equipData = equipIdToEquipData equipId, equips, $equips
      onslot = if i == api_slotnum then 0 else (api_onslot[i])
      if equipData then equipData.concat(onslot) else undefined
