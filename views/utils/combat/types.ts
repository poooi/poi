import type { APISlotItem } from 'kcsapi/api_get_member/require_info/response'
import type { APIShip } from 'kcsapi/api_port/port/response'
import type { APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'

export type GameShip = APIShip & APIMstShip
export type GameEquip = APISlotItem & APIMstSlotitem

export type ShipPredicate = (ship: GameShip) => boolean
export type EquipPredicate = (equip: GameEquip) => boolean
export type EquipsPredicate = (equips: GameEquip[]) => boolean
