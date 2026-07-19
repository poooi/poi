// Deprecated import path kept for plugin backward compatibility, preserving
// the historical pair-based signature. The module now lives in
// 'views/utils/combat/sp-attack' and takes merged GameShip objects.
import type { APIShip } from 'kcsapi/api_port/port/response'
import type { APIMstShip } from 'kcsapi/api_start2/getData/response'

import type { ExtraData } from './combat/sp-attack'

import { isSpAttackAvailable as isSpAttackAvailableMerged } from './combat/sp-attack'

type ShipData = [APIShip, APIMstShip]

/** @deprecated use isSpAttackAvailable from 'views/utils/combat/sp-attack' instead */
export const isSpAttackAvailable = (shipsData: ShipData[], extraData: ExtraData): boolean =>
  isSpAttackAvailableMerged(
    shipsData.map(([ship, $ship]) => ({ ...$ship, ...ship })),
    extraData,
  )
