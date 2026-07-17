import memoize from 'fast-memoize'
import { createSelector } from 'reselect'

import type { EquipDataWithOnslot, ShipData } from './base'

import { arrayResultWrapper, stateSelector } from './base'
import { shipEquipDataSelectorFactory } from './equip'
import {
  fleetInBattleSelectorFactory,
  fleetInExpeditionSelectorFactory,
  fleetShipsIdSelectorFactory,
  inRepairShipsIdSelector,
} from './fleet'
import { escapeStatusSelectorFactory, shipDataSelectorFactory } from './ship'

function getDeckState(
  shipsData: (ShipData | undefined)[] | undefined = [],
  inBattle: unknown,
  inExpedition: unknown,
  inRepairShipsId: number[] | undefined,
): number {
  let state = 0
  if (inBattle) state = Math.max(state, 5)
  if (inExpedition) state = Math.max(state, 4)
  shipsData?.forEach((pair) => {
    if (!pair) return
    const [ship, $ship] = pair
    if (!ship || !$ship) return
    // Cond < 20 or medium damage
    if ((ship.api_cond ?? 100) < 20 || (ship.api_nowhp ?? 1) / (ship.api_maxhp ?? 1) < 0.25)
      state = Math.max(state, 2)
    // Cond < 40 or heavy damage
    else if ((ship.api_cond ?? 100) < 40 || (ship.api_nowhp ?? 1) / (ship.api_maxhp ?? 1) < 0.5)
      state = Math.max(state, 1)
    // Not supplied
    if (
      (ship.api_fuel ?? 0) / ($ship.api_fuel_max ?? 1) < 0.99 ||
      (ship.api_bull ?? 0) / ($ship.api_bull_max ?? 1) < 0.99
    )
      state = Math.max(state, 1)
    // Repairing
    if (inRepairShipsId?.includes(ship.api_id)) state = Math.max(state, 3)
  })
  return state
}

// Returns [ [_ship, $ship] for ship in thisFleet]
// See fleetShipsDataSelectorFactory for detail
// A ship not found in _ships is filled with []
// A ship not found in $ships is filled with [_ship, undefined]
export const fleetShipsDataSelectorFactory = memoize((fleetId: number) =>
  arrayResultWrapper(
    createSelector([stateSelector, fleetShipsIdSelectorFactory(fleetId)], (state, fleetShipsId) =>
      !fleetShipsId
        ? undefined
        : fleetShipsId.map((shipId) => shipDataSelectorFactory(shipId)(state)),
    ),
  ),
)

// Returns [ [_equip, $equip] for ship in thisFleet]
// See shipDataToEquipData
export const fleetShipsEquipDataSelectorFactory = memoize((fleetId: number) =>
  arrayResultWrapper(
    createSelector([stateSelector, fleetShipsIdSelectorFactory(fleetId)], (state, fleetShipsId) =>
      !fleetShipsId
        ? undefined
        : fleetShipsId.map((shipId) => shipEquipDataSelectorFactory(shipId)(state)),
    ),
  ),
)

// excludes escaped ships
export const fleetShipsDataWithEscapeSelectorFactory = memoize((fleetId: number) =>
  arrayResultWrapper(
    createSelector([stateSelector, fleetShipsIdSelectorFactory(fleetId)], (state, fleetShipsId) =>
      !fleetShipsId
        ? undefined
        : fleetShipsId
            .filter((shipId) => !escapeStatusSelectorFactory(shipId)(state))
            .map((shipId) => shipDataSelectorFactory(shipId)(state))
            .filter((data): data is ShipData => data !== undefined),
    ),
  ),
)

export const fleetShipsEquipDataWithEscapeSelectorFactory = memoize((fleetId: number) =>
  arrayResultWrapper(
    createSelector([stateSelector, fleetShipsIdSelectorFactory(fleetId)], (state, fleetShipsId) =>
      !fleetShipsId
        ? undefined
        : fleetShipsId
            .filter((shipId) => !escapeStatusSelectorFactory(shipId)(state))
            .map((shipId) => shipEquipDataSelectorFactory(shipId)(state))
            .filter((data): data is EquipDataWithOnslot[] => data !== undefined),
    ),
  ),
)

export const fleetStateSelectorFactory = memoize((fleetId: number) =>
  createSelector(
    [
      fleetInBattleSelectorFactory(fleetId),
      fleetInExpeditionSelectorFactory(fleetId),
      inRepairShipsIdSelector,
      fleetShipsDataSelectorFactory(fleetId),
    ],
    (inBattle, inExpedition, inRepairShipsId, shipsData) =>
      getDeckState(shipsData, inBattle, inExpedition, inRepairShipsId),
  ),
)
