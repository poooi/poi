import { createSlice } from '@reduxjs/toolkit'

import { createTabSwitchAction } from './actions/ui'

export interface UiState {
  activeMainTab: string
  activeFleetId: number
  activePluginName?: string
}

const initState: UiState = {
  activeMainTab: 'main-view',
  activeFleetId: 0,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: initState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createTabSwitchAction, (state, { payload }) => {
      return {
        ...state,
        ...payload.tabInfo,
      }
    })
  },
})

export const reducer = uiSlice.reducer
