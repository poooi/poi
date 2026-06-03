import type { ConstState } from 'views/redux/const'

const DAIHATSU_TYPE_ID = 24

type ReadyConstSlice = ConstState & {
  $ships: NonNullable<ConstState['$ships']>
  $shipTypes: NonNullable<ConstState['$shipTypes']>
  $equipShip: NonNullable<ConstState['$equipShip']>
  $equips: NonNullable<ConstState['$equips']>
}

function isEquipabilityReady(c: ConstState): c is ReadyConstSlice {
  return !!(c.$ships && c.$shipTypes && c.$equipShip && c.$equips)
}

function stypeCanEquip(
  shipMstId: number,
  equipTypeId: number,
  constState: ReadyConstSlice,
): boolean {
  const ship = constState.$ships[shipMstId]
  if (!ship) return false
  const stypeData = constState.$shipTypes[ship.api_stype]
  if (!stypeData) return false
  return stypeData.api_equip_type[equipTypeId] === 1
}

/**
 * Can shipMstId equip any item of equipTypeId?
 *
 * Resolution order:
 * 1. Per-ship override in api_mst_equip_ship: if the key exists,
 *    the ship can equip at least some items of this type.
 * 2. No override: fall back to the ship's stype default.
 */
export function canEquipType(
  shipMstId: number,
  equipTypeId: number,
  constState: ConstState,
): boolean {
  if (!isEquipabilityReady(constState)) return false

  // Per-ship override: key exists => can equip at least some items of this type
  if (shipMstId in constState.$equipShip) {
    return constState.$equipShip[shipMstId].api_equip_type[equipTypeId] !== undefined
  }

  // Fall back to stype default
  return stypeCanEquip(shipMstId, equipTypeId, constState)
}

/**
 * Can shipMstId equip this specific equip item (by equipMstId)?
 *
 * Resolution order:
 * 1. Per-ship override in api_mst_equip_ship:
 *    - key absent: no
 *    - null: any item of this type allowed
 *    - number[]: only specific mstIDs allowed
 * 2. No override: fall back to stype default.
 */
export function canEquipShipItem(
  shipMstId: number,
  equipMstId: number,
  constState: ConstState,
): boolean {
  if (!isEquipabilityReady(constState)) return false

  // Look up the master equip to get its equip type
  const equip = constState.$equips[equipMstId]
  if (!equip) return false

  const equipTypeId = equip.api_type[2]
  if (equipTypeId == null) return false

  // Per-ship override: key absent => denied, null => any allowed, number[] => specific mstIDs
  if (shipMstId in constState.$equipShip) {
    const typeEntry = constState.$equipShip[shipMstId].api_equip_type[equipTypeId]
    if (typeEntry === undefined) return false
    if (typeEntry === null) return true
    return typeEntry.includes(equipMstId)
  }

  // Fall back to stype default
  return stypeCanEquip(shipMstId, equipTypeId, constState)
}

/**
 * Can shipMstId equip daihatsu (equipment type 24)?
 */
export function canEquipDaihatsu(shipMstId: number, constState: ConstState): boolean {
  return canEquipType(shipMstId, DAIHATSU_TYPE_ID, constState)
}
