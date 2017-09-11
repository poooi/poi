import { fleetShipsDataSelectorFactory } from '../utils/selectors'

const { i18n, config } =  window

const __ = i18n.main.__.bind(i18n.main)

window.addEventListener('game.request', ({ detail: { path } }) => {
  if (!config.get('poi.eventSortieCheck.enable', true)) {
    return
  }

  if (path === '/kcsapi/api_get_member/sortie_conditions') {
    const state = window.getStore()
    let deckData = []
    if (state.sortie.combinedFlag > 0) {
      deckData = [...fleetShipsDataSelectorFactory(0)(state), ...fleetShipsDataSelectorFactory(1)(state)]
        .map(([ship, _] = []) => ship)
        .filter(Boolean)
    } else {
      deckData = fleetShipsDataSelectorFactory(0)(state)
        .map(([ship, _] = []) => ship)
        .filter(Boolean)
    }

    const freeShipCount = deckData.filter(ship => ship.api_sally_area === 0)
    const taggedCount = [
      ...new Set(deckData
        .filter(ship => ship.api_sally_area > 0)
        .map(ship => ship.api_sally_area)),
    ].length

    if (freeShipCount && taggedCount <= 1) {
      window.toast(
        __('At least one ship in your fleet has not been locked'),
        { type: 'warning', title: __('Event ship locking warning') }
      )
    }
  }
})
