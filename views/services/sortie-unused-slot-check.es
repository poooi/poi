/* global getStore, config */
import { fleetStateSelectorFactory } from '../utils/selectors'
import i18next from 'views/env-parts/i18next'

window.addEventListener('game.response', ({ detail: { path, body } }) => {
  if (path !== '/kcsapi/api_get_member/mapinfo') return
  if (!config.get('poi.unusedEquipmentSlotCheck.enable', false)) return

  const ignoreUnlocked = config.get('poi.unusedEquipmentSlotCheck.ignoreUnlocked', false)

  const fleets = getStore('info.fleets')
  const ships = getStore('info.ships')
  const state = getStore()

  const checkSlot = ship => {
    if (ignoreUnlocked && !ship.api_locked) return false
    return (
      ship.api_slot.some((equip, index) => index < ship.api_slotnum && equip === -1) ||
      ship.api_slot_ex === -1
    )
  }

  const flag = fleets
    .filter((_, fleetId) => ![3, 4, 5].includes(fleetStateSelectorFactory(fleetId)(state)))
    .flatMap(fleet => fleet.api_ship)
    .some(shipId => checkSlot(ships[shipId]))

  if (flag) {
    window.toast(i18next.t('main:Unused equipment slot appears in your fleet'), {
      type: 'warning',
      title: i18next.t('main:Unused equipment slot warning'),
    })
  }
})
