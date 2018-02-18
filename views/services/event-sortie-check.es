import { fleetShipsDataSelectorFactory, fleetStateSelectorFactory } from '../utils/selectors'
import _ from 'lodash'
import i18next from 'views/env-parts/i18next'

const { config } =  window

// event sortie check notify for fleets that
// - is not in mission
// - has no ship in repair (docking prevents sortie)
// - has at least 1 ship that has not been tagged
// - ships has less than 2 color tags (multiple-color prevents sortie)
// It is of course insufficient because the existence of easy level and areas that has no tag requirements

const getFleetFlag = fleetData => {
  const data = _(fleetData)
    .map(([ship, _] = []) => ship)
    .filter(Boolean)

  const freeShipCount = data
    .filter(ship => ship.api_sally_area === 0)
    .value()
    .length

  const taggedCount = data
    .filter(ship => ship.api_sally_area > 0)
    .map(ship => ship.api_sally_area)
    .uniq()
    .value()
    .length

  return freeShipCount > 0 && taggedCount <= 1
}

window.addEventListener('game.request', ({ detail: { path } }) => {
  if (!config.get('poi.eventSortieCheck.enable', true)) {
    return
  }

  if (path === '/kcsapi/api_get_member/sortie_conditions') {
    const state = window.getStore()
    let flag = false
    let fleets = [0, 1, 2, 3]
    if (state.sortie.combinedFlag > 0) {
      flag = flag || getFleetFlag([...fleetShipsDataSelectorFactory(0)(state), ...fleetShipsDataSelectorFactory(1)(state)])
      fleets = [2, 3]
    }

    _(fleets)
      .filter(fleetId => ![3, 4, 5].includes(fleetStateSelectorFactory(fleetId)(state))) // 3: Repairing, 4: In mission, 5: In map
      .each(fleetId => {
        flag = flag || getFleetFlag(fleetShipsDataSelectorFactory(fleetId)(state))
      })

    if (flag) {
      window.toast(
        i18next.t('main:At least one ship in your fleet has not been locked'),
        { type: 'warning', title: i18next.t('main:Event ship locking warning') }
      )
    }
  }
})
