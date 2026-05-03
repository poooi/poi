import type { Plugin } from 'views/services/plugin-manager/utils'

import { createAction } from '@reduxjs/toolkit'

export const createPluginInitializeAction = createAction<Plugin[]>('@@Plugin/initialize')

export const createPluginAddAction = createAction<Plugin>('@@Plugin/add')

export const createPluginChangeStatusAction = createAction<{
  packageName: string
  option: Array<{ path: keyof Plugin; status: boolean | string }>
}>('@@Plugin/changeStatus')

export const createPluginRemoveAction = createAction<Plugin>('@@Plugin/remove')
