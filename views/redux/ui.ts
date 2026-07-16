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

// Legacy plugins (e.g. poi-plugin-ezexped) dispatch raw
// `{ type: '@@TabSwitch', tabInfo }` objects instead of the createAction
// payload shape, so `payload` may be missing at runtime.
interface TabSwitchCompatAction {
  type: string
  payload?: { tabInfo?: Partial<UiState> }
  tabInfo?: Partial<UiState>
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: initState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addMatcher(
      (action): action is TabSwitchCompatAction => createTabSwitchAction.match(action),
      (state, action) => {
        const tabInfo = action.payload ? action.payload.tabInfo : action.tabInfo
        return {
          ...state,
          ...tabInfo,
        }
      },
    )
  },
})

export const reducer = uiSlice.reducer
