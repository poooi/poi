import type { APIMstSlotitem } from 'kcsapi/api_start2/getData/response'
import type { ConstState } from 'views/redux/const'

import { canEquipShipItem } from 'views/utils/equipability'

import type { SelectorTables } from './tables'

import { equipTypeSp } from './equip-type'
import { getSelectorTables } from './tables'

/**
 * Which equipment a given ship may carry in a *normal* slot.
 *
 * The table resolution itself — per-ship override in `api_mst_equip_ship`,
 * falling back to the ship type's default set — already lives in
 * `views/utils/equipability`, so this only supplies the type to resolve
 * against.
 *
 * That type is the difference: the picker's `isEquipAbleSlot` checks
 * `equipTypeSp`, not the raw `api_type[2]` that the shared helper defaults to,
 * and a handful of items resolve differently under the two.
 */

/**
 * The equipment type the picker checks an item against. `pickerTypeOverrides`
 * carries the items the game special-cases inside `isEquipAbleSlot` itself
 * (currently only master id 467).
 */
export const pickerEquipType = (
  $equip: APIMstSlotitem,
  tables: SelectorTables = getSelectorTables(),
): number => tables.pickerTypeOverrides[$equip.api_id] ?? equipTypeSp($equip, tables)

/**
 * Can this ship carry this equipment in a normal slot? Returns `false` when the
 * master data needed to answer is not loaded yet.
 *
 * The ex-slot (補強増設) has its own, stricter rule that also depends on the
 * item's improvement level; it is not covered here.
 */
export const canShipEquip = (
  shipMstId: number,
  $equip: APIMstSlotitem,
  constState: ConstState,
  tables: SelectorTables = getSelectorTables(),
): boolean =>
  canEquipShipItem(shipMstId, $equip.api_id, constState, pickerEquipType($equip, tables))
