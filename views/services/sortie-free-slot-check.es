const {i18n, error, config, getStore} = window

const __ = i18n.main.__.bind(i18n.main)

window.addEventListener('game.response',
  ({detail: {path, body}}) => {
    if (path === '/kcsapi/api_get_member/mapinfo') {
      const basic = getStore('info.basic')
      if (config.get('poi.mapStartCheck.ship.enable', false)) {
        const minShipSlots = config.get('poi.mapStartCheck.ship.minFreeSlots', 4)
        const shipSlots = basic.api_max_chara - Object.keys(getStore('info.ships')).length
        if (shipSlots < minShipSlots) {
          setTimeout(() => error(__("Attention! Ship Slot has only %s left.", shipSlots))
          ,1000)
        }
      }
      if (config.get('poi.mapStartCheck.item.enable', false)) {
        const minEquipSlots = config.get('poi.mapStartCheck.item.minFreeSlots', 10)
        const equipSlots = basic.api_max_slotitem - Object.keys(getStore('info.equips')).length
        if (equipSlots < minEquipSlots) {
          const errMsg = __("Attention! Item Slot is full.")
          if (equipSlots > 0){
            const errMsg = __("Attention! Only %d free item slot(s) left!", equipSlots)
            setTimeout(() => error(errMsg)
            , 1000)
          }
        }
      }
    }
  }
)
