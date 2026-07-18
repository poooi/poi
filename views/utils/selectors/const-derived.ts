import { get, values, fromPairs } from 'lodash'
import { createSelector } from 'reselect'

import { canEquipDaihatsu } from '../equipability'
import { constSelector } from './base'

export const allCVEIdsSelector = createSelector(constSelector, (c) =>
  values(get(c, '$ships'))
    .filter(
      (x) =>
        // our ships
        x.api_id <= 1500 &&
        // must be CVL
        x.api_stype === 7 &&
        // have ASW stat
        Array.isArray(x.api_tais) &&
        // in case Tanaka happens
        x.api_tais[0] > 0,
    )
    .map((x) => x.api_id),
)

/*
   returns:

   {
     remodelChains: Array<Array<MstId>>,
     originMstIdOf: Array<OriginMstId>,
   }

   (MstId = Int, OriginMstId = string)

   - note that only master id of non-abyssal units (mstId <= 1500)
     are considered valid.
   - OriginMstId is of string type,
     but for the purpose of index into remodelChains this does not make a difference
   - get original master id by originMstIdOf[<MstId>] = <OriginMstId>
     which is the original form of the ship
   - get remodel chains through remodelChains[<OriginMstId>]: Array<MstId>, in which master ids are sorted
     in the order of remodeling.

 */
export const shipRemodelInfoSelector = createSelector(constSelector, ({ $ships }) => {
  if (!$ships) return { remodelChains: {}, originMstIdOf: {} }

  // master id of all non-abyssal ships
  const mstIds = values($ships)
    .map((x) => x.api_id)
    .filter((x) => x <= 1500)
  // set of masterIds that has some other ship pointing to it (through remodeling)
  const afterMstIdSet = new Set<number>()

  mstIds.forEach((mstId) => {
    const $ship = $ships[mstId]
    if (!$ship) return
    const afterMstId = Number($ship.api_aftershipid)
    if (afterMstId !== 0) afterMstIdSet.add(afterMstId)
  })

  // all those that has nothing pointing to them are originals
  const originMstIds = mstIds.filter((mstId) => !afterMstIdSet.has(mstId))

  // chase remodel chain until we either reach an end or hit a loop
  const searchRemodels = (
    mstId: number,
    results: number[] = [],
    visited = new Set<number>(),
  ): number[] => {
    if (visited.has(mstId)) return results
    visited.add(mstId)
    const newResults = [...results, mstId]
    const $ship = $ships[mstId]
    const afterMstId = Number(get($ship, 'api_aftershipid', 0))
    if (afterMstId !== 0) {
      return searchRemodels(afterMstId, newResults, visited)
    }
    return newResults
  }

  /*
       remodelChains[originMstId] = <RemodelChain>

       - originMstId: master id of the original ship
       - RemodelChain: an Array of master ids, sorted by remodeling order.
     */
  const remodelChains: Record<number, number[]> = fromPairs(
    originMstIds.map((originMstId) => {
      return [originMstId, searchRemodels(originMstId)]
    }),
  )

  const shipsInChain = new Set<number>()
  for (const chain of Object.values(remodelChains)) {
    chain.forEach((item) => shipsInChain.add(item))
  }
  // Master IDs that are not contained in the remodel chain.
  // This is (for now) because some ships does not have originMstId.
  // Here, we take the ascending order and assume the ship with least MstID is the original ship.
  // This might not be the case in the future whenever Tanaka found appropriate.
  let missingMstId = Array.from(
    new Set([...mstIds].filter((element) => !shipsInChain.has(element))),
  ).sort((a, b) => a - b)
  while (missingMstId.length > 0) {
    // Choose the one with least Master ID
    const originMstId = missingMstId[0]
    remodelChains[originMstId] = searchRemodels(originMstId)
    // Remove all master IDs along the newly found chain from missingMstId
    const chainSet = new Set(remodelChains[originMstId])
    missingMstId = missingMstId.filter((element) => !chainSet.has(element))
  }

  // originMstIdOf[<master id>] = <original master id>
  const originMstIdOf: Record<number, number | string> = {}
  Object.entries(remodelChains).forEach(([originMstId, remodelChain]) => {
    remodelChain.forEach((mstId) => {
      originMstIdOf[mstId] = originMstId
    })
  })
  return { remodelChains, originMstIdOf }
})

export const canEquipDaihatsuSelector = createSelector(
  constSelector,
  (constState) => (shipMstId: number) => canEquipDaihatsu(shipMstId, constState),
)
