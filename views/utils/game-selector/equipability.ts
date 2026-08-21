import type { APIMstSlotitem } from 'kcsapi/api_start2/getData/response'
import type { ConstState } from 'views/redux/const'
import type { Equip } from 'views/redux/info/equips'

import { canEquipShipItem, canEquipType } from 'views/utils/equipability'

import type { SelectorTables } from './tables'

import { equipType, equipTypeSp } from './equip-type'
import { getSelectorTables } from './tables'

/**
 * Which equipment a given ship may carry, in a given slot.
 *
 * The table resolution itself — per-ship override in `api_mst_equip_ship`,
 * falling back to the ship type's default set — already lives in
 * `views/utils/equipability`, so this supplies the type to resolve against and
 * layers the picker's two extra rules on top: the per-slot exclusions in
 * `SlotUtil.excludeEquipList`, and the ex-slot rule in `isEquipAbleSlot`.
 *
 * The type is the difference from the shared helper: the picker checks
 * `equipTypeSp`, not the raw `api_type[2]`, and a handful of items resolve
 * differently under the two.
 */

/** The ex-slot (補強増設) rather than one of the numbered slots. */
export const EXTRA_SLOT = 'extra'

export type SlotTarget = number | typeof EXTRA_SLOT

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
 * Does this ship's slot bar this equipment type?
 *
 * Ports `SlotUtil.excludeEquipList`, which returns the types a slot rejects —
 * expressing "only these three" as "everything except these three".
 */
export const slotRejectsType = (
  shipMstId: number,
  slot: number,
  equipTypeId: number,
  tables: SelectorTables = getSelectorTables(),
): boolean =>
  tables.slotExclusions.some((rule) => {
    if (!rule.shipMstIds.includes(shipMstId)) return false
    if (rule.fromSlot ? slot < rule.slot : slot !== rule.slot) return false
    if (rule.allowOnly) return !rule.allowOnly.includes(equipTypeId)
    return rule.exclude?.includes(equipTypeId) ?? false
  })

/**
 * Can this ship carry this equipment in its ex-slot?
 *
 * Ports the `TargetSlotType.EXTRA` branch of `isEquipAbleSlot`. Two routes in,
 * and both require the ship to accept the type in a normal slot first:
 *
 * - by type: the type is ex-slot capable (`api_mst_equip_exslot`) and this ship
 *   is not one of the ships barred from it (`api_mst_equip_limit_exslot`);
 * - by item: `api_mst_equip_exslot_ship` names this exact item for this ship,
 *   its class or its type, and the item is improved to the required level.
 */
export const canShipEquipExtra = (
  shipMstId: number,
  equip: Equip,
  $equip: APIMstSlotitem,
  constState: ConstState,
  tables: SelectorTables = getSelectorTables(),
): boolean => {
  const type = pickerEquipType($equip, tables)
  // Both routes are gated on the ship being able to carry the type at all.
  if (!canEquipType(shipMstId, type, constState)) return false

  const barred = constState.$exslotEquipLimits?.[shipMstId] ?? []
  if ((constState.$exslotEquips ?? []).includes(type) && !barred.includes(type)) return true

  const perItem = constState.$exslotEquipShips?.[$equip.api_id]
  if (!perItem) return false
  if ((equip.api_level ?? 0) < (perItem.api_req_level ?? 0)) return false

  const $ship = constState.$ships?.[shipMstId]
  if (!$ship) return false
  const listed = (table: { [key: string]: number } | null | undefined, value: number) =>
    table != null && String(value) in table

  return (
    listed(perItem.api_ship_ids, shipMstId) ||
    listed(perItem.api_ctypes, $ship.api_ctype) ||
    // 99 is the wildcard the game accepts alongside the ship's own type
    listed(perItem.api_stypes, $ship.api_stype) ||
    listed(perItem.api_stypes, 99)
  )
}

/**
 * The same exclusion, keyed the way the list the item belongs to keys it.
 *
 * The game applies `excludeEquipList` twice with two different type values: the
 * 未装備 list subtracts the excluded types from the target type set, which
 * `isEquipAbleSlot` then matches by `pickerEquipType`, while the 他艦娘装備中
 * list filters on the raw `api_type[2]`. The two disagree for the few items
 * whose `equipTypeSp` differs from their raw type — the 51cm guns and the
 * 15m測距儀+電探 combos — and this reproduces that rather than tidying it up.
 */
export const slotRejectsEntry = (
  shipMstId: number,
  slot: number,
  $equip: APIMstSlotitem,
  listMode: 'unset' | 'set',
  tables: SelectorTables = getSelectorTables(),
): boolean =>
  slotRejectsType(
    shipMstId,
    slot,
    listMode === 'set' ? equipType($equip) : pickerEquipType($equip, tables),
    tables,
  )

/**
 * Can this ship carry this equipment in the given slot? Returns `false` when
 * the master data needed to answer is not loaded yet.
 *
 * With no slot named, this answers for the ship as a whole — what a normal slot
 * with no restriction of its own would take.
 */
export const canShipEquip = (
  shipMstId: number,
  entry: { equip: Equip; $equip: APIMstSlotitem },
  constState: ConstState,
  slot?: SlotTarget,
  tables: SelectorTables = getSelectorTables(),
): boolean => {
  const { equip, $equip } = entry
  if (slot === EXTRA_SLOT) {
    return canShipEquipExtra(shipMstId, equip, $equip, constState, tables)
  }
  if (!canEquipShipItem(shipMstId, $equip.api_id, constState, pickerEquipType($equip, tables))) {
    return false
  }
  if (slot == null) return true
  return !slotRejectsType(shipMstId, slot, pickerEquipType($equip, tables), tables)
}
