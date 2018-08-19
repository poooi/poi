import { flatMap, map, get } from 'lodash'

export const damagedCheck = ({$ships, $equips}, {sortieStatus, escapedPos}, {fleets, ships, equips}) => {
  const damagedShips = []
  const sortieShips = flatMap(sortieStatus, (sortie, index) =>
    sortie ? get(fleets, [index, 'api_ship'], []) : []
  )

  const flagships = map(sortieStatus, (sortie, index) => sortie ? get(fleets, [index, 'api_ship', 0], -1) : -1).filter(id => id > -1)

  sortieShips.forEach((shipId, idx) => {
    if (shipId === -1 || flagships.includes(shipId)) {
      return
    }
    const ship = ships[shipId]
    const $ship = $ships[ship.api_ship_id]
    if (!ship || (ship.api_nowhp / ship.api_maxhp) >= 0.250001) {
      return
    }
    // escapedPos is non-empty only in combined fleet mode
    if ((escapedPos || []).includes(idx)) {
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

  return damagedShips
}

export const gameRefreshPage = () => {
  window.getStore('layout.webview.ref').getWebContents().reload()
}

export const gameRefreshPageIgnoringCache = () => {
  window.getStore('layout.webview.ref').reloadIgnoringCache()
}

export const gameReloadFlash = () => {
  window.getStore('layout.webview.ref').executeJavaScript(`
  var doc;
  if (document.getElementById('game_frame')) {
    doc = document.getElementById('game_frame').contentDocument;
  } else {
    doc = document;
  }
  var flash = doc.getElementById('flashWrap');
  if(flash) {
    var flashInnerHTML = flash.innerHTML;
    flash.innerHTML = '';
    flash.innerHTML = flashInnerHTML;
  }
  `)
}
