import type { APIMstSlotitem } from 'kcsapi/api_start2/getData/response'

import type { SelectorTables } from './tables'

import { getSelectorTables } from './tables'

/**
 * Equipment classification as the game computes it.
 *
 * The picker never groups by `api_type[3]` (the icon) directly. It works on
 * three derived values, ported here from the game's slot-item master model:
 *
 * - `equipType`          — `api_type[2]`, the raw equipment type.
 * - `equipTypeSp`        — `equipType` with a handful of per-item overrides.
 * - `equipTypeForFilter` — `equipTypeSp`, plus overrides that split a type by
 *                          icon (night-capable planes, AA guns, and so on).
 *
 * The synthetic types (81-95) exist only in these derived values; no master
 * item carries them in `api_type`. The override tables live in `./tables` so
 * fcd can correct them without a release.
 */

/** `api_type[2]`. */
export const equipType = ($equip: APIMstSlotitem): number => {
  const type = $equip.api_type
  return !type || type.length < 4 ? -1 : type[2]
}

/** `api_type[3]`. */
export const iconType = ($equip: APIMstSlotitem): number => {
  const type = $equip.api_type
  return !type || type.length < 4 ? -1 : type[3]
}

export const equipTypeSp = (
  $equip: APIMstSlotitem,
  tables: SelectorTables = getSelectorTables(),
): number => tables.equipTypeSpOverrides[$equip.api_id] ?? equipType($equip)

export const equipTypeForFilter = (
  $equip: APIMstSlotitem,
  tables: SelectorTables = getSelectorTables(),
): number => {
  const type = equipType($equip)
  const icon = iconType($equip)
  for (const split of tables.filterTypeSplits) {
    if (split.types.includes(type) && icon === split.icon) return split.result
  }
  return equipTypeSp($equip, tables)
}

/** The `equipTypeForFilter` values a top-level category accepts. */
export const typesOfCategory = (
  categoryId: number,
  tables: SelectorTables = getSelectorTables(),
): number[] => {
  const category = tables.equipFilterCategories.find((c) => c.id === categoryId)
  if (!category) return []
  return category.details.flatMap((detail) => tables.filteringDetailCategories[detail] ?? [])
}
