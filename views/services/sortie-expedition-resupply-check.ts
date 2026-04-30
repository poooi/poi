import { getStore } from 'views/create-store'
import { config } from 'views/env'
import i18next from 'views/env-parts/i18next'

window.addEventListener('game.response', (e) => {
  // game.response is a CustomEvent dispatched internally with a known shape
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const { path } = (e as CustomEvent<{ path: string }>).detail
  if (!config.get('poi.expeditionResupplyCheck.enable', false)) return
  if (path !== '/kcsapi/api_get_member/mission') return

  const fleets = getStore('info.fleets')
  const ships = getStore('info.ships')
  const $ships = getStore('const.$ships')
  const needResupply = fleets
    .filter((_, index) => index !== 0)
    .flatMap((fleet) => fleet.api_ship)
    .some((shipId) => {
      if (!$ships) return false
      const ship = ships[shipId]
      if (!ship?.api_ship_id) return false
      const $ship = ship != null ? $ships[ship.api_ship_id] : undefined
      if (!$ship) return false
      return (
        (ship.api_bull ?? 0) < ($ship.api_bull_max ?? 0) ||
        (ship.api_fuel ?? 0) < ($ship.api_fuel_max ?? 0)
      )
    })

  if (needResupply) {
    window.toast(i18next.t('main:At least one fleet has not been fully resupplied'), {
      type: 'warning',
      title: i18next.t('main:Expedition resupply warning'),
    })
  }
})
