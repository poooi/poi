import { createSlice } from '@reduxjs/toolkit'

import { createAPIPortPortResponseAction } from './actions/response'
import { combineReducers } from './combine-reducers'

export interface MiscState {
  canNotify: boolean
}

const canNotifySlice = createSlice({
  name: 'misc/canNotify',
  initialState: false,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createAPIPortPortResponseAction, () => true)
  },
})

export default combineReducers<MiscState>({
  canNotify: canNotifySlice.reducer,
})
