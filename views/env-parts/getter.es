import {observer, observe} from 'redux-observers'
import {store} from '../createStore'

Object.defineProperty(window, '$slotitems', {get: () => {
  return window.getStore('const.$equips')
}})
Object.defineProperty(window, '$slotitemTypes', {get: () => {
  return window.getStore('const.$equipTypes')
}})
Object.defineProperty(window, '$mapareas', {get: () => {
  return window.getStore('const.$mapareas')
}})
Object.defineProperty(window, '$maps', {get: () => {
  return window.getStore('const.$maps')
}})
Object.defineProperty(window, '$missions', {get: () => {
  return window.getStore('const.$missions')
}})
Object.defineProperty(window, '$shipTypes', {get: () => {
  return window.getStore('const.$shipTypes')
}})
Object.defineProperty(window, '$ships', {get: () => {
  return window.getStore('const.$ships')
}})
Object.defineProperty(window, '$useitems', {get: () => {
  return window.getStore('const.$useitems')
}})
Object.defineProperty(window, '_decks', {get: () => {
  return window.getStore('info.fleets')
}})
Object.defineProperty(window, '_nickName', {get: () => {
  return window.getStore('info.basic.api_nickname')
}})
Object.defineProperty(window, 'api_nickname_id', {get: () => {
  return window.getStore('info.basic.api_nickname_id')
}})
Object.defineProperty(window, '_teitokuId', {get: () => {
  return window.getStore('info.basic.api_member_id')
}})
Object.defineProperty(window, '_teitokuExp', {get: () => {
  return window.getStore('info.basic.api_experience')
}})
Object.defineProperty(window, '_teitokuLv', {get: () => {
  return window.getStore('info.basic.api_level')
}})
Object.defineProperty(window, '_ndock', {get: () => {
  let ret = []
  for (let i = 0; i < 4; i++) {
    ret.push(window.getStore(`info.repairs.${i}.api_ship_id`))
  }
}})

const updateShips = (store) => {
  return observer(
    (state) => state.info.ships,
    (dispatch, current, previous) => {
      window._ships = new Proxy(window.getStore('info.ships'), {
        get: (target, property, receiver) => {
          let ship = target[property]
          if (ship === undefined) {
            return undefined
          }
          return new Proxy(ship, {
            get: (innerTarget, innerProperty, innerReceiver) => {
              return ship[innerProperty] || window.getStore(`const.$ships.${ship.api_ship_id}.${innerProperty}`)
            }
          })
        }
      })
    }
  )
}

const updateSlotitems = (store) => {
  return observer(
    (state) => state.info.equips,
    (dispatch, current, previous) => {
      window._slotitems = new Proxy(window.getStore('info.equips'), {
        get: (target, property, receiver) => {
          let equip = target[property]
          if (equip === undefined) {
            return undefined
          }
          return new Proxy(equip, {
            get: (innerTarget, innerProperty, innerReceiver) => {
              return equip[innerProperty] || window.getStore(`const.$equips.${equip.api_slotitem_id}.${innerProperty}`)
            }
          })
        }
      })
    }
  )
}

observe(store, [updateShips(store), updateSlotitems(store)])
