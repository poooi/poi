// Deprecated import path kept for plugin backward compatibility, preserving
// the historical pair-based signature. The module now lives in
// 'views/utils/combat/aapb' and takes merged GameShip / GameEquip objects.
import type { APISlotItem } from 'kcsapi/api_get_member/require_info/response'
import type { APIShip } from 'kcsapi/api_port/port/response'
import type { APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'

import { getShipAAPB as getShipAAPBMerged } from './combat/aapb'

type EquipPair = [APISlotItem, APIMstSlotitem, number | undefined]

type ShipPair = [APIShip, APIMstShip]

/** @deprecated use getShipAAPB from 'views/utils/combat/aapb' instead */
export const getShipAAPB = ([ship, $ship]: ShipPair, equipsInfo: EquipPair[]): number =>
  getShipAAPBMerged(
    { ...$ship, ...ship },
    equipsInfo.map(([equip, $equip]) => ({ ...$equip, ...equip })),
  )
