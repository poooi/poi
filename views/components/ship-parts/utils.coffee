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

  getShipStatus: (miniFlag, shipId, escapeId, towId) ->
    status = -1
    # retreat status
    if shipId == escapeId || shipId == towId
      return status = 0
    # repairing
    else if shipId in _ndocks
      return status = 1
    # supply
    else if miniFlag and (Math.min _ships[shipId].api_fuel / _ships[shipId].api_fuel_max * 100, _ships[shipId].api_bull / _ships[shipId].api_bull_max * 100) < 100
      return status = 6
    # special 1 locked phase 1
    else if _ships[shipId].api_sally_area == 1
      return status = 2
    # special 2 locked phase 2
    else if _ships[shipId].api_sally_area == 2
      return status = 3
    # special 3 locked phase 3
    else if  _ships[shipId].api_sally_area == 3
      return status = 4
    # special 4 locked phase 4
    else if _ships[shipId].api_sally_area == 4
      return status = 5
    return status

  getHpStyle: (percent) ->
    if percent <= 25
      'danger'
    else if percent <= 50
      'warning'
    else if percent <= 75
      'info'
    else
      'success'
