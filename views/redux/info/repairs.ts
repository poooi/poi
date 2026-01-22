import _ from 'lodash'
import { compareUpdate } from 'views/utils/tools'
import { observer } from 'redux-observers'
import { Dispatch } from 'redux'

export interface RepairData {
  api_id?: number
  api_member_id?: number
  api_complete_time: number
  api_complete_time_str: string
  api_item1: number
  api_item2: number
  api_item3: number
  api_item4: number
  api_ship_id: number
  api_state: number
}

export type RepairsState = RepairData[]

interface Action {
  type: string
  body?: RepairData[] | { api_ndock?: RepairData[] }
  postBody?: {
    api_ndock_id?: string | number
  }
}

interface RootState {
  info: {
    repairs: RepairsState
  }
}

// Preserved fields: api_id, api_member_id
const emptyRepair: Partial<RepairData> = {
  api_complete_time: 0,
  api_complete_time_str: '0',
  api_item1: 0,
  api_item2: 0,
  api_item3: 0,
  api_item4: 0,
  api_ship_id: 0,
  api_state: 0,
}

export function reducer(state: RepairsState = [], { type, body, postBody }: Action): RepairsState {
  switch (type) {
    case '@@Response/kcsapi/api_get_member/ndock':
      return compareUpdate(state, body as RepairData[])
    case '@@Response/kcsapi/api_port/port':
      return compareUpdate(state, (body as { api_ndock?: RepairData[] })?.api_ndock)
    case '@@Response/kcsapi/api_req_nyukyo/speedchange': {
      const api_ndock_id = Number(postBody?.api_ndock_id)
      const newState = state.slice()
      newState[api_ndock_id - 1] = {
        ...newState[api_ndock_id - 1],
        ...emptyRepair,
      } as RepairData
      return newState
    }
  }
  return state
}

// observe docking complete events and modify ship HP accordingly.
export const dockingCompleteObserver = observer(
  (state: RootState) => state.info.repairs,
  (dispatch: Dispatch, current: RepairsState, previous: RepairsState) => {
    /*
       only observe valid state changes:
       - the state should be available before and after
       - no length change allowed
     */
    if (!Array.isArray(current) || !Array.isArray(previous) || current.length !== previous.length) {
      return
    }

    current.map((repairDataCur, ind) => {
      const repairDataPrev = previous[ind]
      const rstId = repairDataPrev.api_ship_id

      if (
        // roster id is valid
        _.isInteger(rstId) &&
        rstId > 0 &&
        // sanity check: now current position should be empty
        repairDataCur.api_ship_id === 0 &&
        // state transition: docking complete
        repairDataPrev.api_state === 1 &&
        repairDataCur.api_state === 0
      ) {
        dispatch({
          type: '@@info.ships@RepairCompleted',
          body: { api_ship_id: rstId },
        })
      }
    })
  },
)
