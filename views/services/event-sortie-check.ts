import type { Ship } from 'views/redux/info/ships'

import { getStore } from 'views/create-store'
import { config } from 'views/env'
import i18next from 'views/env-parts/i18next'

import { fleetShipsDataSelectorFactory, fleetStateSelectorFactory } from '../utils/selectors'

// event sortie check notify for fleets that
// - is not in mission
// - has no ship in repair (docking prevents sortie)
// - has at least 1 ship that has not been tagged
// - ships has less than 2 color tags (multiple-color prevents sortie)
// It is of course insufficient because the existence of easy level and areas that has no tag requirements

const getFleetFlag = (fleetData: ([Ship, unknown] | undefined)[] | undefined) => {
  if (!fleetData) return false
  const ships = fleetData
    .map((item) => item?.[0] ?? null)
    .filter((ship): ship is Ship => ship != null)

  const freeShipCount = ships.filter((ship) => !ship.api_sally_area).length
  const taggedCount = new Set(
    ships.map((ship) => ship.api_sally_area).filter((area): area is number => (area ?? 0) > 0),
  ).size

  return freeShipCount > 0 && taggedCount <= 1
}

window.addEventListener('game.request', (e) => {
  const { path } = e.detail
  if (!config.get('poi.eventSortieCheck.enable', true)) {
    return
  }

  if (path === '/kcsapi/api_get_member/sortie_conditions') {
    const state = getStore()
    let flag = false
    let fleets = [0, 1, 2, 3]
    if (state.sortie.combinedFlag > 0) {
      flag =
        flag ||
        getFleetFlag([
          ...(fleetShipsDataSelectorFactory(0)(state) ?? []),
          ...(fleetShipsDataSelectorFactory(1)(state) ?? []),
        ])
      fleets = [2, 3]
    }

    fleets
      .filter((fleetId) => ![3, 4, 5].includes(fleetStateSelectorFactory(fleetId)(state)))
      .forEach((fleetId) => {
        flag = flag || getFleetFlag(fleetShipsDataSelectorFactory(fleetId)(state))
      })

    if (flag) {
      window.toast(i18next.t('main:At least one ship in your fleet has not been locked'), {
        type: 'warning',
        title: i18next.t('main:Event ship locking warning'),
      })
    }
  }
})
