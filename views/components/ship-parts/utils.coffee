class BaseShipData
  constructor: (shipId) ->
    {$ships, $shipTypes, _ships, _slotitems} = window
    ship = _ships[shipId]
    shipInfo = $ships[ship.api_ship_id]
    @id = shipId
    @type = $shipTypes[shipInfo.api_stype].api_name
    @name = shipInfo.api_name
    @lv = ship.api_lv
    @nextEXP = ship.api_exp[1]
    @nowHp = ship.api_nowhp
    @maxHp = ship.api_maxhp
    @cond = ship.api_cond
    @slotItems = []
    @slotItemExist = false
    for itemId, i in ship.api_slot.concat(ship.api_slot_ex || 0)
      continue unless (i < ship.api_slot_num) or (i == 5 and itemId != 0)
      item = _slotitems[itemId] || {api_name: "", api_type: [0, 0, 0, 0]}
      @slotItemExist = @slotItemExist or _slotitems[itemId]?
      @slotItems[i] =
        id: itemId
        onslot: ship.api_onslot[i]
        maxeq: ship.api_maxeq[i]
        isExist: _slotitems[itemId]?
        name: item.api_name
        level: item.api_level
        alv: item.api_alv
        slotitemId: item.api_type[3]

between = (n, min, max) ->
  n >= min && n <= max

module.exports =
  BaseShipData: BaseShipData
  getMaterialStyle: (percent) ->
    if percent <= 50
      'danger'
    else if percent <= 75
      'warning'
    else if percent < 100
      'info'
    else
      'success'

  getStatusStyle: (status) ->
    if status?
      flag = status == 0 or status == 1 # retreat or repairing
      if flag? and flag
        return {opacity: 0.4}
    else
      return {}

  getShipLabelStatus: (ship, $ship, inRepair) ->
    return -1 if !ship? || !$ship?
    # repairing
    if inRepair
      return 1
    # supply
    else if Math.min(ship.api_fuel/$ship.api_fuel_max, ship.api_bull/$ship.api_bull_max) < 1
      return 6
    # special: locked phase
    # returns 2 for locked phase 1, 3 for phase 2, etc
    else if ship.api_sally_area in [1..4]
      return ship.api_sally_area + 1
    return -1

  getHpStyle: (percent) ->
    if percent <= 25
      'danger'
    else if percent <= 50
      'warning'
    else if percent <= 75
      'info'
    else
      'success'

  # equipIconId: as in $equip.api_type[3]
  equipIsAircraft: (equipIconId) ->
    equipIconId? && (
      between(equipIconId, 6, 10) || 
      between(equipIconId, 21, 22) || 
      equipIconId == 33
    )
