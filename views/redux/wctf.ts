import { createSlice } from '@reduxjs/toolkit'

import { createWctfDbUpdateAction } from './actions/app'

export type WctfState = Record<string, unknown>

const wctfSlice = createSlice({
  name: 'wctf',
  initialState: {} as WctfState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createWctfDbUpdateAction, (state, { payload }) => ({
      ...state,
      ...payload,
    }))
  },
})

export const reducer = wctfSlice.reducer
