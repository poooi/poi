/**
 * Models the in-game 艦船選択 / 装備選択 pickers so poi can report *where* a
 * ship or equipment sits in them (filter tab, page number, row index).
 *
 * The filtering and ordering here are ports of the game's own code rather than
 * reconstructions: ships follow `ShipUtil.sort` / `ShipUtil.filterByShipFilterType`,
 * equipment follows `SlotUtil.sort` / `SlotUtil.filter` over `SlotConst`'s
 * category tables, and the per-ship equipment rule follows `EquipModel`.
 * Deviations and the few values the game hardcodes are called out at their
 * definitions.
 */
export * from './tables'
export * from './types'
export * from './ship'
export * from './equip'
export * from './equipability'
