window.addEventListener 'game.response', 
  ({detail: {path, body}}) ->
    if path == '/kcsapi/api_get_member/mapinfo'
      basic = getStore 'info.basic'
      if config.get 'poi.mapStartCheck.ship.enable', false
        minShipSlots = config.get 'poi.mapStartCheck.ship.minFreeSlots', 4
        shipSlots = basic.api_max_chara - Object.keys(getStore('info.ships')).length
        if shipSlots < minShipSlots
          setTimeout =>
            error __ "Attention! Ship Slot has only %s left.", "#{@state.maxChara - @state.shipCount}"
          , 1000
      if config.get 'poi.mapStartCheck.item.enable', false
        minEquipSlots = config.get 'poi.mapStartCheck.item.minFreeSlots', 10
        equipSlots = basic.api_max_slotitem - Object.keys(getStore('info.equips')).length
        if slotsLeft < minFreeItemSlots
          errMsg = __ "Attention! Item Slot is full."
          if slotsLeft > 0
            errMsg = __ "Attention! Only %d free item slot(s) left!", slotsLeft
          setTimeout =>
            error errMsg
          , 1000
