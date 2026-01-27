import type { APIBasic as PortAPIBasic } from 'kcsapi/api_port/port/response'

import { createSlice } from '@reduxjs/toolkit'
import { compareUpdate } from 'views/utils/tools'

import {
  createAPIGetMemberRequireInfoAction,
  createAPIPortPortResponseAction,
  createAPIReqMissionResultResponseAction,
  createAPIReqPracticeResultResponseAction,
  createAPIReqSortieBattleResultResponseAction,
} from '../actions'

type BasicState = Partial<PortAPIBasic>

const basicSlice = createSlice({
  name: 'basic',
  initialState: {} as BasicState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createAPIPortPortResponseAction, (state, { payload }) => {
        return compareUpdate(state, payload.body.api_basic)
      })
      .addCase(createAPIGetMemberRequireInfoAction, (state, { payload }) => {
        return compareUpdate(state, {
          api_member_id: `${payload.body.api_basic.api_member_id}`,
        })
      })
      .addCase(createAPIReqMissionResultResponseAction, (state, { payload }) => {
        return compareUpdate(state, {
          api_level: payload.body.api_member_lv,
        })
      })
      .addCase(createAPIReqPracticeResultResponseAction, (state, { payload }) => {
        return compareUpdate(state, {
          api_experience: payload.body.api_member_exp,
          api_level: payload.body.api_member_lv,
        })
      })
      .addCase(createAPIReqSortieBattleResultResponseAction, (state, { payload }) => {
        return compareUpdate(state, {
          api_experience: payload.body.api_member_exp,
          api_level: payload.body.api_member_lv,
        })
      })
  },
})

export const reducer = basicSlice.reducer
