import { createAction } from '@reduxjs/toolkit'

export const createTabSwitchAction = createAction<{
  tabInfo: {
    activeMainTab?: string
    activeFleetId?: number
    activePluginName?: string
  }
  autoSwitch?: boolean
}>('@@TabSwitch')

export type TabSwitchAction = ReturnType<typeof createTabSwitchAction>
