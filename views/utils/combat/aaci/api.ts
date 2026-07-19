import { maxBy } from 'lodash'

import type { GameEquip, GameShip } from '../types'
import type { AACIEntry } from './types'

import { AACITable } from './table'

// NOTE: AACITable is populated by importing './entries' (done in './index').
// Import this module through 'views/utils/aaci' so registration has run.

// return: a list of sorted AACI objects order by effect desc,
//   as most effective AACI gets priority to be triggered.
// param: AACI IDs from possibleAACIs functions
// param: a optional sorting callback to customize ordering
const sortAaciIds = (
  aaciIds: number[] | null | undefined,
  sortCallback: (a: AACIEntry, b: AACIEntry) => number = (a, b) =>
    b.fixed - a.fixed || b.modifier - a.modifier,
): AACIEntry[] => {
  let aaciList: AACIEntry[] = []
  if (aaciIds && Array.isArray(aaciIds)) {
    aaciIds.forEach((id) => {
      if (AACITable[id]) {
        aaciList.push(AACITable[id])
      }
    })
    aaciList = aaciList.sort(sortCallback)
  }
  return aaciList
}

// Order by AACI id desc
export const sortFleetPossibleAaciList = (triggeredShipAaciIds: number[]): AACIEntry[] =>
  sortAaciIds(triggeredShipAaciIds, (a, b) => b.id - a.id)

// return a list of AACIs that meet the requirement of ship and equipment
// ship: ship
// equips: [[equip, onslot] for equip on ship]
export const getShipAvailableAACIs = (ship: GameShip, equips: GameEquip[]): number[] =>
  Object.keys(AACITable)
    .filter((key) => {
      const type = AACITable[Number(key)]
      return type.shipValid(ship) && type.equipsValid(equips)
    })
    .map((key) => Number(key))

// return a list of all possible AACIs for the ship herself
export const getShipAllAACIs = (ship: GameShip): number[] =>
  Object.keys(AACITable)
    .filter((key) => {
      const type = AACITable[Number(key)]
      return type.shipValid(ship)
    })
    .map((key) => Number(key))

// return the AACIs to trigger for a ship, it will be array due to exceptions
export const getShipAACIs = (ship: GameShip, equips: GameEquip[]): number[] => {
  const AACIs = getShipAvailableAACIs(ship, equips)
  const maxFixed = maxBy(AACIs, (id) => (AACITable[id] || {}).fixed || 0) || 0
  // Kinu kai 2 exception
  if (AACIs.includes(19)) {
    return [19, 20]
  }
  if (maxFixed === 8 && AACIs.includes(20)) {
    return [8, 20]
  }
  if (maxFixed === 8 && AACIs.includes(7)) {
    return [7, 8]
  }
  // Kasumi Kai 2 B since 17 and 9 have same shotdown
  if (AACIs.includes(17) && maxFixed === 9) {
    return [17]
  }
  // Isuzu Kai 2 since 14 and 8 have same shotdown
  if (AACIs.includes(14) && maxFixed === 8) {
    return [14]
  }
  // Satsuki Kai 2
  if (AACIs.includes(18)) {
    return [...new Set([maxFixed, 18])]
  }
  // Fumitsuki Kai 2, not verified, only assumption
  if (AACIs.includes(22)) {
    return [...new Set([maxFixed, 22])]
  }

  return maxFixed ? [maxFixed] : []
}

// collections of AACIs to trigger of each ship
export const getFleetAvailableAACIs = (ships: GameShip[], equips: GameEquip[][]): number[] => {
  const aaciSet: Record<number, boolean> = {}
  ships.forEach((ship, index) => {
    getShipAACIs(
      ship,
      equips[index].map((equip) => equip),
    ).forEach((id) => {
      aaciSet[id] = true
    })
  })
  return Object.keys(aaciSet).map((key) => Number(key))
}
