import i18next from 'views/env-parts/i18next'

window.addEventListener('game.response', (e) => {
  // game.response is a CustomEvent dispatched internally with a known shape
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const { path } = (e as CustomEvent<{ path: string }>).detail
  if (!config.get('poi.expeditionResupplyCheck.enable', false)) return
  if (path !== '/kcsapi/api_get_member/mission') return

  // getStore returns unknown; these shapes are the well-known Redux store structure
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const fleets = getStore('info.fleets') as Array<{ api_ship: number[] }>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const ships = getStore('info.ships') as Record<
    number,
    { api_ship_id: number; api_bull: number; api_fuel: number } | undefined
  >
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const $ships = getStore('const.$ships') as Record<
    number,
    { api_bull_max: number; api_fuel_max: number } | undefined
  >
  const needResupply = fleets
    .filter((_, index) => index !== 0)
    .flatMap((fleet) => fleet.api_ship)
    .some((shipId) => {
      const ship = ships[shipId]
      const $ship = ship != null ? $ships[ship.api_ship_id] : undefined
      if (!ship || !$ship) return false
      return ship.api_bull < $ship.api_bull_max || ship.api_fuel < $ship.api_fuel_max
    })

  if (needResupply) {
    window.toast(i18next.t('main:At least one fleet has not been fully resupplied'), {
      type: 'warning',
      title: i18next.t('main:Expedition resupply warning'),
    })
  }
})
