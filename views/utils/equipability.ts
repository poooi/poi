import type {
  APIMstEquipShip,
  APIMstShip,
  APIMstSlotitem,
  APIMstStype,
} from 'kcsapi/api_start2/getData/response'

export interface EquipabilityConstSlice {
  $equipShip?: Record<string, APIMstEquipShip>
  $shipTypes?: Record<string, APIMstStype>
  $ships?: Record<string, APIMstShip>
  $equips?: Record<string, APIMstSlotitem>
}

const DAIHATSU_TYPE_ID = 24

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
  constState: EquipabilityConstSlice,
): boolean {
  const { $equipShip, $shipTypes, $ships } = constState
  if (!$equipShip || !$shipTypes || !$ships) return false

  const typeKey = String(equipTypeId)
  const shipKey = String(shipMstId)

  if (shipKey in $equipShip) {
    return $equipShip[shipKey].api_equip_type[typeKey] !== undefined
  }

  const ship = $ships[shipKey]
  if (!ship) return false
  const stypeData = $shipTypes[String(ship.api_stype)]
  if (!stypeData) return false

  return stypeData.api_equip_type[typeKey] === 1
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
  constState: EquipabilityConstSlice,
): boolean {
  const { $equipShip, $shipTypes, $ships, $equips } = constState
  if (!$equipShip || !$shipTypes || !$ships || !$equips) return false

  const equip = $equips[String(equipMstId)]
  if (!equip) return false

  const equipTypeId = equip.api_type[2]
  if (equipTypeId == null) return false

  const typeKey = String(equipTypeId)
  const shipKey = String(shipMstId)

  if (shipKey in $equipShip) {
    const typeEntry = $equipShip[shipKey].api_equip_type[typeKey]
    if (typeEntry === undefined) return false
    if (typeEntry === null) return true
    return typeEntry.includes(equipMstId)
  }

  const ship = $ships[shipKey]
  if (!ship) return false
  const stypeData = $shipTypes[String(ship.api_stype)]
  if (!stypeData) return false

  return stypeData.api_equip_type[typeKey] === 1
}

/**
 * Can shipMstId equip daihatsu (equipment type 24)?
 */
export function canEquipDaihatsu(shipMstId: number, constState: EquipabilityConstSlice): boolean {
  return canEquipType(shipMstId, DAIHATSU_TYPE_ID, constState)
}
