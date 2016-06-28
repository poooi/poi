const initState = {
  cond: Date.now(),
  _condTempShips: undefined,
}

const threeMinutes = 3 * 60 * 1000

export function reducer(state=initState, {type, postBody, body}) {
  switch (type) {
    case '@@Response/kcsapi/api_port/port': {
      let now = Date.now()
      // The maximum possible cond regen if the timer is correct
      let predictElapsedCond = Math.floor((now - (state.cond || now)) / threeMinutes) * 3
      // Always update initially
      let update = !state._condTempShips
      let maxElapsedCond = 0
      if (!update) {
        let shipNum = body.api_ship.length
        for (let i = 0; i < shipNum; i++) {
          let {api_cond: nowCond, api_id} = body.api_ship[i]
          let prevCond = state._condTempShips[api_id]
          if (prevCond == null) {
            continue
          }
          // The timer is wrong
          if (nowCond - prevCond > predictElapsedCond) {
            update = true
            continue
          }

          // Used to update the timer based on the updated cond
          maxElapsedCond = Math.max(nowCond-prevCond, maxElapsedCond)

          // Could have updated if the timer was wrong
          // therefore the timer is corrent
          if (nowCond + predictElapsedCond <= 46) {
            break
          }
        }
      }
      let _condTempShips = {}
      body.api_ship.forEach(({api_id, api_cond}) => {
        _condTempShips[api_id] = api_cond
      })
      let timer
      if (update) {
        timer = now 
      } else {
        timer = state.cond + Math.ceil(maxElapsedCond / 3) * threeMinutes
      }
      return {
        ...state,
        cond: now,
        _condTempShips,
      }
    }
  }
  return state
}
