__ = i18n.main.__.bind(i18n.main)

window.addEventListener 'game.response',
  ({detail: {path, body, postBody}}) ->
    if path in ['/kcsapi/api_req_map/start', '/kcsapi/api_req_map/next']
      state = getStore()
      {sortieStatus, escapedPos} = state.sortie
      {fleets, ships, equips} = state.info
      {$equips} = state.const
      damagedShips = []
      for deckId in [0..3]
        continue unless sortieStatus[deckId]
        fleet = fleets[deckId] || {api_ship: []}
        for shipId, idx in fleet.api_ship
          continue if shipId == -1 or idx == 0
          ship = ships[shipId]
          continue if !ship || ship.api_nowhp / ship.api_maxhp >= 0.250001
          continue if (deckId*6 + idx) in escapedPos
          # Check Emergency repair personnel / goddess
          safe = false
          for slotId in ship.api_slot.concat(ship.api_slot_ex || -1)
            continue if slotId == -1
            safe = true if $equips[equips[slotId]?.api_id].api_type[3] == 14
          if !safe
            damagedShips.push("Lv. #{ship.api_lv} - #{ship.api_name}")
      if damagedShips.length > 0
        toggleModal __('Attention!'), damagedShips.join(' ') + __('is heavily damaged!')
