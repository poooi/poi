import { getStore } from 'views/create-store'
import { config } from 'views/env-parts/config'
import i18next from 'views/env-parts/i18next'
import { error } from 'views/services/alert'
import { getSlotitemCount } from 'views/utils/game-utils'

window.addEventListener('game.response', (e) => {
  const { path } = e.detail
  if (path === '/kcsapi/api_get_member/mapinfo') {
    const basic = getStore('info.basic')
    const errMsg: string[] = []
    if (config.get('poi.mapStartCheck.ship.enable', false)) {
      const minShipSlots = config.get('poi.mapStartCheck.ship.minFreeSlots', 4) as number
      const shipSlots = (basic.api_max_chara ?? 0) - Object.keys(getStore('info.ships')).length
      if (shipSlots < minShipSlots) {
        if (shipSlots > 0) {
          errMsg.push(i18next.t('main:ShipSlotWarning', { count: shipSlots }))
        } else {
          errMsg.push(i18next.t('main:ShipSlotFull'))
        }
      }
    }
    if (config.get('poi.mapStartCheck.item.enable', false)) {
      const minEquipSlots = config.get('poi.mapStartCheck.item.minFreeSlots', 10) as number
      const equipSlots = (basic.api_max_slotitem ?? 0) - getSlotitemCount(getStore('info.equips'))
      if (equipSlots < minEquipSlots) {
        if (equipSlots > 0) {
          errMsg.push(i18next.t('main:EquipSlotWarning', { count: equipSlots }))
        } else {
          errMsg.push(i18next.t('main:EquipSlotFull'))
        }
      }
    }
    if (errMsg.length > 0) {
      const msg = errMsg.join('')
      setTimeout(() => error(msg), 1000)
    }
  }
})
