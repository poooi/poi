import type { APISlotItem } from 'kcsapi/api_get_member/require_info/response'
import type { APIShip } from 'kcsapi/api_port/port/response'
import type { APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'
import type { RootState } from 'views/redux/reducer-factory'

import * as remote from '@electron/remote'
import { map, get, mapValues } from 'lodash'
import { observer, observe } from 'redux-observers'
import { createSelector } from 'reselect'
import { store, getStore } from 'views/create-store'
import { buildArray } from 'views/utils/tools'

import { config } from './config'
import { ipc } from './ipc'

function object2Array(obj: Record<string, unknown>) {
  return buildArray(map(obj, (v, k) => [Number(k), v]))
}
function object2ArraySelectorFactory(path: string) {
  const pathSelector = (state: unknown) => get(state, path)
  return createSelector(pathSelector, (obj) => object2Array(obj))
}

// User config
const language = window.language
Object.defineProperty(window, 'language', {
  get: () => {
    return config.get('poi.misc.language', language)
  },
})
Object.defineProperty(window, 'layout', {
  get: () => {
    return config.get('poi.layout.mode', 'horizontal')
  },
})
Object.defineProperty(window, 'doubleTabbed', {
  get: () => {
    return config.get('poi.tabarea.double', false)
  },
})
Object.defineProperty(window, 'webviewWidth', {
  get: () => {
    return config.get('poi.webview.width', 1200)
  },
})
Object.defineProperty(window, 'zoomLevel', {
  get: () => {
    return config.get('poi.appearance.zoom', 1)
  },
})
Object.defineProperty(window, 'useSVGIcon', {
  get: () => {
    return config.get('poi.appearance.svgicon', false)
  },
})
Object.defineProperty(window, 'screenshotPath', {
  get: () => {
    return config.get('poi.misc.screenshot.path', remote.getGlobal('DEFAULT_SCREENSHOT_PATH'))
  },
})
window.notify = window.notify || {}
Object.defineProperty(window.notify, 'morale', {
  get: () => {
    return config.get('poi.notify.morale.value', 49)
  },
})
Object.defineProperty(window.notify, 'expedition', {
  get: () => {
    return config.get('poi.notify.expedition.value', 60)
  },
})

// Game data
Object.defineProperty(window, '$slotitems', {
  get: () => {
    return getStore('const.$equips') || {}
  },
})
Object.defineProperty(window, '$slotitemTypes', {
  get: () => {
    return getStore('const.$equipTypes') || {}
  },
})
const mapareasObject2ArraySelector = object2ArraySelectorFactory('const.$mapareas')
Object.defineProperty(window, '$mapareas', {
  get: () => {
    return mapareasObject2ArraySelector(getStore())
  },
})
Object.defineProperty(window, '$maps', {
  get: () => {
    return getStore('const.$maps') || {}
  },
})
const missionsObject2ArraySelector = object2ArraySelectorFactory('const.$missions')
Object.defineProperty(window, '$missions', {
  get: () => {
    return missionsObject2ArraySelector(getStore())
  },
})
Object.defineProperty(window, '$shipTypes', {
  get: () => {
    return getStore('const.$shipTypes') || {}
  },
})
Object.defineProperty(window, '$ships', {
  get: () => {
    return getStore('const.$ships') || {}
  },
})
Object.defineProperty(window, '$useitems', {
  get: () => {
    return getStore('const.$useitems') || {}
  },
})
Object.defineProperty(window, '_decks', {
  get: () => {
    return getStore('info.fleets') || []
  },
})
Object.defineProperty(window, '_nickName', {
  get: () => {
    return getStore('info.basic.api_nickname') || ''
  },
})
Object.defineProperty(window, '_nickNameId', {
  get: () => {
    return getStore('info.basic.api_nickname_id') || -1
  },
})
Object.defineProperty(window, '_teitokuId', {
  get: () => {
    return getStore('info.basic.api_member_id') || -1
  },
})
Object.defineProperty(window, '_teitokuExp', {
  get: () => {
    return getStore('info.basic.api_experience') || 0
  },
})
Object.defineProperty(window, '_teitokuLv', {
  get: () => {
    return getStore('info.basic.api_level') || 0
  },
})
Object.defineProperty(window, '_ndocks', {
  get: () => {
    return getStore('info.repairs')?.map((repair) => repair.api_ship_id) || []
  },
})
Object.defineProperty(window, '_eventMapRanks', {
  get: () => {
    return mapValues(getStore('info.maps'), (m) => get(m, 'api_eventmap.api_selected_rank'))
  },
})
Object.defineProperty(window, '_serverIp', {
  get: () => {
    return getStore('info.server.ip')
  },
})
Object.defineProperty(window, '_serverId', {
  get: () => {
    return getStore('info.server.id')
  },
})
Object.defineProperty(window, '_serverName', {
  get: () => {
    return getStore('info.server.name')
  },
})

declare global {
  interface Window {
    /** @deprecated Use `store.info.ships` instead */
    _ships: Record<`${number}` | number, APIShip>
    /** @deprecated Use `store.info.equips` instead */
    _slotitems: Record<`${number}` | number, APISlotItem>
    /** @deprecated Use `store.const.$ships` instead */
    $ships: Record<`${number}` | number, APIMstShip>
    /** @deprecated Use `store.const.$equips` instead */
    $slotitems: Record<`${number}` | number, APIMstSlotitem>
  }
}

const initShips = () => {
  window._ships = new Proxy(
    { ...getStore('info.ships') },
    {
      get: (target, property) => {
        const ship = target[Number(property)]
        if (typeof ship === 'undefined') {
          return undefined
        }
        const shipRecord = ship
        return new Proxy(shipRecord, {
          get: (_innerTarget, innerProperty) => {
            // @ts-expect-error force type assertion
            const key: keyof APIShip = innerProperty
            if (key in shipRecord) return shipRecord[key]
            return getStore(`const.$ships.${shipRecord.api_ship_id}.${String(innerProperty)}`)
          },
        })
      },
    },
  )
}

const initEquips = () => {
  window._slotitems = new Proxy(
    { ...getStore('info.equips') },
    {
      get: (target, property) => {
        const equip = target[Number(property)]
        if (typeof equip === 'undefined') {
          return undefined
        }
        const equipRecord = equip
        return new Proxy(equipRecord, {
          get: (_innerTarget, innerProperty) => {
            // @ts-expect-error force type assertion
            const key: keyof APISlotItem = innerProperty
            if (key in equipRecord) return equipRecord[key]
            return getStore(`const.$equips.${equipRecord.api_slotitem_id}.${String(innerProperty)}`)
          },
        })
      },
    },
  )
}

const initWebviewWidth = () => {
  const w = getStore('layout.webview.width')
  ipc.register('WebView', {
    width: typeof w === 'number' && !Number.isNaN(w) ? w : 1200,
  })
}

initShips()
initEquips()
initWebviewWidth()

const shipsObserver = observer((state: RootState) => state.info?.ships, initShips)

const slotitemsObserver = observer((state: RootState) => state.info?.equips, initEquips)

const webviewSizeObserver = observer(
  (state: RootState) => state.layout?.webview?.width,
  initWebviewWidth,
)

observe(store, [shipsObserver, slotitemsObserver, webviewSizeObserver])
