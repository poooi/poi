import _ from 'lodash'
import { compareUpdate } from 'views/utils/tools'
import { observer } from 'redux-observers'

// Preserved fields: api_id, api_member_id
const emptyRepair = {
  api_complete_time: 0,
  api_complete_time_str: '0',
  api_item1: 0,
  api_item2: 0,
  api_item3: 0,
  api_item4: 0,
  api_ship_id: 0,
  api_state: 0,
}

export function reducer(state=[], {type, body, postBody}) {
  switch (type) {
  case '@@Response/kcsapi/api_get_member/ndock':
    return compareUpdate(state, body)
  case '@@Response/kcsapi/api_port/port':
    return compareUpdate(state, body.api_ndock)
  case '@@Response/kcsapi/api_req_nyukyo/speedchange': {
    const {api_ndock_id} = postBody
    state = state.slice()
    state[api_ndock_id-1] = {
      ...state[api_ndock_id-1],
      ...emptyRepair,
    }
    state
  }
  }
  return state
}

// observe docking complete events and modify ship HP accordingly.
export const dockingCompleteObserver = observer(
  state => state.info.repairs,
  (dispatch, current, previous) => {
    /*
       only observe valid state changes:
       - the state should be available before and after
       - no length change allowed
     */
    if (
      !Array.isArray(current) ||
      !Array.isArray(previous) ||
      current.length !== previous.length
    ) {
      return
    }

    current.map((repairDataCur, ind) => {
      const repairDataPrev = previous[ind]
      const rstId = repairDataPrev.api_ship_id

      if (
        // roster id is valid
        _.isInteger(rstId) && rstId > 0 &&
        // sanity check: now current position should be empty
        repairDataCur.api_ship_id === 0 &&
        // state transition: docking complete
        repairDataPrev.api_state === 1 &&
        repairDataCur.api_state === 0
      ) {
        dispatch({
          type: '@@info.ships@RepairCompleted',
          body: {api_ship_id: rstId},
        })
      }
    })
  }
)
