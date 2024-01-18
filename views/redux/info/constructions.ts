import { APIKdock } from 'kcsapi/api_get_member/require_info/response'
import {
  createAPIGetMemberKdockResponseAction,
  createAPIGetMemberRequireInfoAction,
  createAPIReqKousyouCreateShipSpeedChangeResponseAction,
  createAPIReqKousyouGetShipResponseAction,
} from '../actions'
import { createSlice } from '@reduxjs/toolkit'

const completeConstruction = {
  api_complete_time: 0,
  api_complete_time_str: '0',
  api_state: 3,
}

const constructionsSlice = createSlice({
  name: 'constructions',
  initialState: [] as APIKdock[],
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createAPIGetMemberRequireInfoAction, (state, { payload }) => {
        return payload.body.api_kdock
      })
      .addCase(createAPIReqKousyouGetShipResponseAction, (state, { payload }) => {
        return payload.body.api_kdock
      })
      .addCase(createAPIGetMemberKdockResponseAction, (state, { payload }) => {
        return payload.body
      })
      .addCase(createAPIReqKousyouCreateShipSpeedChangeResponseAction, (state, { payload }) => {
        const { api_kdock_id } = payload.postBody
        const dockId = parseInt(api_kdock_id, 10)
        const newState = state.slice()
        newState[dockId - 1] = Object.assign({}, newState[dockId - 1], completeConstruction)
        return newState
      })
  },
})

export const reducer = constructionsSlice.reducer
