import type { RepairData } from 'views/redux/info/repairs'
import type { RootState } from 'views/redux/reducer-factory'

import memoize from 'fast-memoize'
import { get, map } from 'lodash'
import { createSelector } from 'reselect'

import { arrayResultWrapper, repairsSelector, sortieStatusSelector } from './base'

// Returns [shipId for every ship in repair]
// Returns undefined if uninitialized
export const inRepairShipsIdSelector = arrayResultWrapper(
  createSelector(repairsSelector, (repairs: RepairData[] | undefined) => {
    if (!repairs) return
    return map(
      repairs.filter((repair) => repair.api_state == 1),
      'api_ship_id',
    )
  }),
)

export const fleetSelectorFactory = memoize(
  (fleetId: number) => (state: RootState) => (state.info.fleets || [])[fleetId],
)
export const landbaseSelectorFactory = memoize(
  (landbaseId: number) => (state: RootState) => (state.info.airbase || [])[landbaseId],
)

// Returns [shipId] of this fleet
// Returns undefined if fleet not found
export const fleetShipsIdSelectorFactory = memoize((fleetId: number) =>
  arrayResultWrapper(
    createSelector(fleetSelectorFactory(fleetId), (fleet) => {
      if (fleet == null) return
      return fleet.api_ship.filter((n) => n != -1)
    }),
  ),
)

export const fleetSlotCountSelectorFactory = memoize((fleetId: number) =>
  createSelector([fleetSelectorFactory(fleetId)], (fleet) => get(fleet, 'api_ship.length', 0)),
)

export const fleetInBattleSelectorFactory = memoize((fleetId: number) =>
  createSelector(sortieStatusSelector, (sortieStatus) => sortieStatus[fleetId]),
)
export const fleetInExpeditionSelectorFactory = memoize((fleetId: number) =>
  createSelector(fleetSelectorFactory(fleetId), (fleet) =>
    typeof fleet === 'object' ? (fleet.api_mission?.[0] ?? false) : false,
  ),
)
export const fleetNameSelectorFactory = memoize((fleetId: number) =>
  createSelector(fleetSelectorFactory(fleetId), (fleet) =>
    typeof fleet === 'object' ? (fleet.api_name ?? '') : '',
  ),
)

const emptyExpedition = [0, 0, 0, 0]
export const fleetExpeditionSelectorFactory = memoize((fleetId: number) =>
  createSelector(fleetSelectorFactory(fleetId), (fleet) =>
    fleet ? (fleet.api_mission ?? emptyExpedition) : emptyExpedition,
  ),
)

// Reads props.fleetId
// Returns <repairDock> if this ship is in repair
// Returns undefined if uninitialized or not in repair
export const shipRepairDockSelectorFactory = memoize((shipId: number) =>
  createSelector(repairsSelector, (repairs) => {
    if (repairs == null) return
    return repairs.find(({ api_state, api_ship_id }) => api_state == 1 && api_ship_id == shipId)
  }),
)
