import i18next from 'views/env-parts/i18next'

const { error, config, getStore } = window


window.addEventListener('game.response',
  ({detail: {path, body}}) => {
    if (path === '/kcsapi/api_get_member/mapinfo') {
      const basic = getStore('info.basic')
      const errMsg = []
      if (config.get('poi.mapStartCheck.ship.enable', false)) {
        const minShipSlots = config.get('poi.mapStartCheck.ship.minFreeSlots', 4)
        const shipSlots = basic.api_max_chara - Object.keys(getStore('info.ships')).length
        if (shipSlots < minShipSlots) {
          if (shipSlots > 0){
            errMsg.push(i18next.t("main:ShipSlotWarning", { count: shipSlots }))
          } else {
            errMsg.push(i18next.t("main:ShipSlotFull"))
          }
        }
      }
      if (config.get('poi.mapStartCheck.item.enable', false)) {
        const minEquipSlots = config.get('poi.mapStartCheck.item.minFreeSlots', 10)
        const equipSlots = basic.api_max_slotitem - Object.keys(getStore('info.equips')).length
        if (equipSlots < minEquipSlots) {
          if (equipSlots > 0){
            errMsg.push(i18next.t("main:EquipSlotWarning", { count: equipSlots }))
          } else {
            errMsg.push(i18next.t("main:EquipSlotFull"))
          }
        }
      }
      if (errMsg.length > 0) {
        const msg = errMsg.join('')
        setTimeout(() => error(msg) , 1000)
      }
    }
  }
)
