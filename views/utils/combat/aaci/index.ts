// ported from KC3kai's AACI module
// url: https://github.com/KC3Kai/KC3Kai/blob/master/src/library/modules/AntiAir.js
// commit a9edbe5
// in thankful acknowledgment of their hard work
// some variable and function naming are modified

// Populate AACITable (side effect) before exposing the query API.
import './entries'

export type { GameShip, GameEquip } from '../types'
export type { AACIEntry } from './types'
export { AACITable } from './table'
export {
  sortFleetPossibleAaciList,
  getShipAvailableAACIs,
  getShipAllAACIs,
  getShipAACIs,
  getFleetAvailableAACIs,
} from './api'
