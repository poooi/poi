import type { ConstState } from 'views/redux/const'
import type { RootState } from 'views/redux/reducer-factory'
import type { EquipEntry, ShipEntry } from 'views/utils/game-selector'

import { createSelector } from 'reselect'
import { mergeSelectorTables } from 'views/utils/game-selector'
import { constSelector, equipsSelector, shipsSelector } from 'views/utils/selectors'

/** Roster ships joined with master data; ships without master data are dropped. */
export const shipEntriesSelector = createSelector(
  [shipsSelector, constSelector],
  (ships, { $ships }: ConstState): ShipEntry[] => {
    if (!$ships) return []
    const entries: ShipEntry[] = []
    Object.values(ships).forEach((ship) => {
      const $ship = $ships[ship.api_ship_id]
      if ($ship) entries.push({ ship, $ship })
    })
    return entries
  },
)

/** Maps an equipment roster id to the roster id of the ship carrying it. */
const equippedOnSelector = createSelector([shipsSelector], (ships) => {
  const map = new Map<number, number>()
  Object.values(ships).forEach((ship) => {
    const slots = [...(ship.api_slot ?? []), ship.api_slot_ex ?? -1]
    slots.forEach((equipId) => {
      if (typeof equipId === 'number' && equipId > 0) map.set(equipId, ship.api_id)
    })
  })
  return map
})

export const equipEntriesSelector = createSelector(
  [equipsSelector, constSelector, equippedOnSelector],
  (equips, { $equips }: ConstState, equippedOn): EquipEntry[] => {
    if (!$equips) return []
    const entries: EquipEntry[] = []
    Object.values(equips).forEach((equip) => {
      const $equip = $equips[equip.api_slotitem_id]
      if ($equip) entries.push({ equip, $equip, equippedOn: equippedOn.get(equip.api_id) })
    })
    return entries
  },
)

/**
 * The picker tables in force: poi's built-in defaults with any fcd correction
 * layered on top, so main.js changes can be shipped without a poi release.
 */
export const selectorTablesSelector = createSelector(
  [(state: RootState) => state.fcd?.gameselector],
  (tables) => mergeSelectorTables(tables),
)
