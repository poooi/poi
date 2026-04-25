import type { ConstState } from 'views/redux/const'
import type { InfoState } from 'views/redux/info'
import type { SortieState } from 'views/redux/sortie'

import { flatMap, map, get } from 'lodash'
import { config } from 'views/env-parts/config'

export const damagedCheck = (
  { $ships, $equips }: ConstState,
  { sortieStatus, escapedPos }: SortieState,
  { fleets, ships, equips }: InfoState,
) => {
  const damagedShips: string[] = []
  const sortieShips = flatMap(sortieStatus, (sortie, index) =>
    sortie ? get(fleets, [index, 'api_ship'], []) : [],
  )

  const flagships = map(sortieStatus, (sortie, index) =>
    sortie ? get(fleets, [index, 'api_ship', 0], -1) : -1,
  ).filter((id) => id > -1)

  sortieShips.forEach((shipId, idx) => {
    if (shipId === -1 || flagships.includes(shipId)) {
      return
    }
    const ship = ships[shipId]
    const $ship = $ships?.[ship?.api_ship_id ?? -1]
    if (!ship || (ship.api_nowhp ?? 0) / (ship.api_maxhp ?? 1) >= 0.250001) {
      return
    }
    // escapedPos is non-empty only in combined fleet mode
    if ((escapedPos || []).includes(idx)) {
      return
    }
    // Check Emergency repair personnel / goddess
    let safe = false
    ship?.api_slot?.concat(ship.api_slot_ex || -1).forEach((slotId) => {
      if (slotId === -1) {
        return
      }
      if (Number($equips?.[equips?.[slotId]?.api_slotitem_id ?? -1]?.api_type?.[3] ?? 0) === 14) {
        safe = true
      }
    })
    if (!safe) {
      damagedShips.push(`Lv. ${ship.api_lv} - ${$ship?.api_name}`)
    }
  })

  return damagedShips
}

export const gameRefreshPage = () => {
  window.getStore('layout.webview.ref')?.getWebContents().reload()
}

export const gameRefreshPageIgnoringCache = () => {
  window.getStore('layout.webview.ref')?.reloadIgnoringCache()
}

export const gameReload = () => {
  window.getStore('layout.webview.ref')?.executeJavaScript(`
  var doc;
  if (document.getElementById('game_frame')) {
    doc = document.getElementById('game_frame').contentDocument;
  } else {
    doc = document;
  }

  var game = doc.getElementById('htmlWrap');
  if (game) {
    game.contentWindow.location.reload()
  }
  `)
}

export const getPoiInfoHeight = () => document.querySelector('poi-info')?.clientHeight ?? 0

export const getTitleBarHeight = () => document.querySelector('title-bar')?.clientHeight ?? 0

export const getYOffset = () => getPoiInfoHeight() + getTitleBarHeight()

export const getRealSize = (value?: number) =>
  Math.floor((value ?? 0) * config.get('poi.appearance.zoom', 1))

export const getZoomedSize = (value?: number) =>
  Math.floor((value ?? 0) / config.get('poi.appearance.zoom', 1))
