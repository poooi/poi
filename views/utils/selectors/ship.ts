import type { SortieState } from 'views/redux/sortie'

import memoize from 'fast-memoize'
import { get, flatMap } from 'lodash'
import { createSelector } from 'reselect'

import type { ShipData } from './base'

import {
  arrayResultWrapper,
  constSelector,
  fleetsSelector,
  shipsSelector,
  sortieSelector,
} from './base'

// Selector for all ship ids that in sortie, including the -1 placeholders
const sortieShipIdSelector = arrayResultWrapper(
  createSelector(
    [
      fleetsSelector, // we need the -1 placeholder here because escapedPos is by index
      sortieSelector,
    ],
    (fleet, { sortieStatus }: SortieState) =>
      flatMap(sortieStatus, (sortie, index) => (sortie ? get(fleet, [index, 'api_ship'], []) : [])),
  ),
)

export const escapeStatusSelectorFactory = memoize((shipId: number) =>
  createSelector(
    [sortieShipIdSelector, sortieSelector],
    (sortieShipIds, { escapedPos }: SortieState) =>
      shipId > 0 && escapedPos.some((pos) => sortieShipIds[pos] === shipId),
  ),
)

// There's a Number type check
// (exported for the ship slot/equip selectors in './equip')
export const shipBaseDataSelectorFactory = memoize((shipId: number) =>
  createSelector([shipsSelector], (ships) =>
    ships && typeof shipId === 'number' && shipId ? ships[shipId] : undefined,
  ),
)

// Reads props.shipId
// Returns [_ship, $ship]
// Returns undefined if uninitialized, or if ship not found in _ship
// Attention: shipId here only accepts Number type,
//   otherwise will always return undefined
export const shipDataSelectorFactory = memoize((shipId: number) =>
  arrayResultWrapper(
    createSelector([shipBaseDataSelectorFactory(shipId), constSelector], (ship, { $ships }) =>
      $ships && typeof ship === 'object' && ship
        ? ([ship, $ships[ship.api_ship_id ?? -1]] as ShipData)
        : undefined,
    ),
  ),
)
