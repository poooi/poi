import type { APIMstSlotitem } from 'kcsapi/api_start2/getData/response'
import type { ConstState } from 'views/redux/const'

import type { SelectorTables } from './tables'

import { equipTypeSp } from './equip-type'
import { getSelectorTables } from './tables'

/**
 * Which equipment a given ship may carry in a *normal* slot.
 *
 * Ported from the game's `EquipModelHolder.get` + `EquipModel.isEquipmentValid`
 * pair, which the equipment picker uses to build its list. Both read only
 * `api_start2` master data (`api_mst_equip_ship` and `api_mst_stype`), so the
 * rule itself follows the game automatically as new ships and equipment ship.
 *
 * NOTE: this intentionally keys on `equipTypeSp`, not the raw `api_type[2]`
 * that `views/utils/equipability.ts` uses. The game applies the special-cased
 * type here, and a handful of items (the ones in `EQUIP_TYPE_SP_OVERRIDES`,
 * plus master id 467) resolve differently under the two rules.
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
 * The per-ship equip table: type id → allowed master ids, or `null` for "any
 * item of this type". Mirrors `EquipModelHolder.get`, including its fallback to
 * the ship type's default set when the ship has no override entry.
 */
const equipTableOf = (
  shipMstId: number,
  constState: ConstState,
): Record<number, number[] | null> | undefined => {
  const { $equipShip, $ships, $shipTypes } = constState
  if (!$ships || !$shipTypes) return undefined

  const override = $equipShip?.[shipMstId]
  if (override) return override.api_equip_type

  const $ship = $ships[shipMstId]
  if (!$ship) return undefined
  const stype = $shipTypes[$ship.api_stype]
  if (!stype) return undefined

  const table: Record<number, number[] | null> = {}
  Object.entries(stype.api_equip_type).forEach(([typeId, allowed]) => {
    if (allowed === 1) table[Number(typeId)] = null
  })
  return table
}

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
): boolean => {
  const table = equipTableOf(shipMstId, constState)
  if (!table) return false
  const type = pickerEquipType($equip, tables)
  if (!(type in table)) return false
  const allowed = table[type]
  return allowed === null || allowed.includes($equip.api_id)
}
