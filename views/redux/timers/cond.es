import { forEach } from 'lodash'

const threeMinutes = 3 * 60 * 1000

// Calculates the time that a ship fully recovers 
// tick: the number you get from store.timers.cond.tick
export function recoveryEndTime(tick, nowCond, targetCond) {
  return Math.ceil(Math.max(targetCond - nowCond, 0) / 3) * threeMinutes + tick
}

const initState = {
  conds: {},
  tick: Date.now(),
}

export default function reducer(state=initState, {type, postBody, body}) {
  switch (type) {
  case '@@Response/kcsapi/api_port/port': {
    /* Algorithm: 
     * 1. Record a "tick". Conds increase on a certain tick within every 3 minutes.
     *    We want to approach a specific tick, the one during the last 3-minute cycle.
     * 2. Record conds of ships. Update them every time they change.
     * 3. Everytime ship conds increase, compare predictions with actual 
     *    increases, and see if any ship has predIncrease < actualIncrease.
     *   o) If no misprediction happens, record the new ship conds, and the 
     *      latest tick before now.
     *   o) If misprediction happens, record the new ship conds, and now as the
     *      new tick.
     */
    const {conds: oldConds, tick: oldTick} = state
    const now = Date.now()
    const predictIncrease = Math.floor((now - oldTick) / threeMinutes) * 3

    const conds = {}
    let condNeedsUpdate = false
    let misprediction = false
    // Use lodash.forEach because it supports breaking by returning false
    forEach(body.api_ship, (ship) => {
      const {api_cond: cond, api_id} = ship
      conds[api_id] = cond
      if (cond !== oldConds[api_id]) {
        condNeedsUpdate = true
        if (!(api_id in oldConds)) {
          return
        }
      }
      if (cond - oldConds[api_id] > predictIncrease) {
        misprediction = true
        return false  // break; This is as much information as we can get
      }
    })
    if (!condNeedsUpdate && !misprediction)
      return state
    const newState = {}
    if (condNeedsUpdate) {
      newState.conds = conds
      if (misprediction) {
        newState.tick = now
      } else {
        // Latest tick before now
        newState.tick = oldTick + Math.floor((now - oldTick) / threeMinutes) * threeMinutes
      }
    }
    return {
      ...state,
      ...newState,
    }
  }
  }
  return state
}
