const {i18n, getStore, toggleModal} =  window

const __ = i18n.main.__.bind(i18n.main)

const damagedCheck = ({$ships, $equips}, {sortieStatus, escapedPos}, {fleets, ships, equips}) => {
  const damagedShips = []
  for (let deckId = 0; deckId <= 3; deckId++) {
    if (!sortieStatus[deckId]) {
      continue
    }
    const fleet = fleets[deckId] || {
      api_ship: [],
    }
    fleet.api_ship.forEach((shipId, idx) => {
      if (shipId === -1 || idx === 0) {
        return
      }
      const ship = ships[shipId]
      const $ship = $ships[ship.api_ship_id]
      if (!ship || ship.api_nowhp / ship.api_maxhp >= 0.250001) {
        return
      }
      // escapedPos is non-empty only in combined fleet mode
      if ((escapedPos || []).includes(deckId * 6 + idx)) {
        return
      }
      // Check Emergency repair personnel / goddess
      let safe = false
      ship.api_slot.concat(ship.api_slot_ex || -1).forEach(slotId => {
        if (slotId === -1) {
          return
        }
        if (parseInt(((($equips || {})[((equips || {})[slotId] || {}).api_slotitem_id] || {}).api_type || [])[3]) === 14) {
          safe = true
        }
      })
      if (!safe) {
        damagedShips.push(`Lv. ${ship.api_lv} - ${$ship.api_name}`)
      }
    })
  }
  return damagedShips
}

window.addEventListener('game.response', ({detail: {path, body, postBody}}) => {
  if (path === '/kcsapi/api_req_map/start' || path === '/kcsapi/api_req_map/next') {
    // const {$ships, $equips} = getStore('const') || {}
    // const {sortieStatus, escapedPos} = getStore('sortie') || {}
    // const {fleets, ships, equips} = getStore('info') || {}
    const damagedShips = damagedCheck(getStore('const'), getStore('sortie'), getStore('info'))
    if (damagedShips.length > 0) {
      return toggleModal(__('Attention!'), damagedShips.join(' ') + __('is heavily damaged!'))
    }
  }
})
