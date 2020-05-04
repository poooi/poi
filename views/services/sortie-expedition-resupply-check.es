/* global config, getStore */
import i18next from 'views/env-parts/i18next'

window.addEventListener('game.response', ({ detail: { path } }) => {
  if (!config.get('poi.expeditionResupplyCheck.enable', false)) return
  if (path !== '/kcsapi/api_get_member/mission') return

  const fleets = getStore('info.fleets')
  const ships = getStore('info.ships')
  const $ships = getStore('const.$ships')
  const needResupply = fleets
    .filter((_, index) => index !== 0)
    .flatMap((fleet) => fleet.api_ship)
    .some((shipId) => {
      const ship = ships[shipId]
      const $ship = $ships[ship.api_ship_id]
      return ship.api_bull < $ship.api_bull_max || ship.api_fuel < $ship.api_fuel_max
    })

  if (needResupply) {
    window.toast(i18next.t('main:At least one fleet has not been fully resupplied'), {
      type: 'warning',
      title: i18next.t('main:Expedition resupply warning'),
    })
  }
})
