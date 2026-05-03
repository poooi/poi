import type { Plugin } from 'views/services/plugin-manager/utils'

import { createSlice, current } from '@reduxjs/toolkit'
import { sortBy } from 'lodash'
import { reduxSet } from 'views/utils/tools'

import {
  createPluginAddAction,
  createPluginChangeStatusAction,
  createPluginInitializeAction,
  createPluginRemoveAction,
} from '../actions/plugins'

export const sortPlugins = (ps: Plugin[]): Plugin[] => sortBy(ps, ['priority', 'packageName'])

const pluginsSlice = createSlice({
  name: 'plugins',
  initialState: [] as Plugin[],
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createPluginInitializeAction, (_state, { payload }) => payload)
      .addCase(createPluginAddAction, (state, { payload: plugin }) => {
        const arr = current(state)
        const i = arr.findIndex((p) => p.packageName === plugin.packageName)
        if (i === -1) {
          return sortPlugins([...arr, plugin])
        }
        const newArr = [...arr]
        newArr[i] = plugin
        return sortPlugins(newArr)
      })
      .addCase(createPluginChangeStatusAction, (state, { payload: { packageName, option } }) => {
        const arr = current(state)
        const i = arr.findIndex((p) => p.packageName === packageName)
        if (!arr[i]) {
          return
        }
        let pluginToUpdate = { ...arr[i] }
        for (const opt of option) {
          const { path, status } = opt
          // @ts-expect-error force type assertion
          pluginToUpdate = reduxSet(pluginToUpdate, path.split('.'), status)
        }
        return sortPlugins([...arr.slice(0, i), pluginToUpdate, ...arr.slice(i + 1)])
      })
      .addCase(createPluginRemoveAction, (state, { payload: plugin }) => {
        const arr = current(state)
        const i = arr.findIndex((p) => p.packageName === plugin.packageName)
        if (i === -1) {
          return
        }
        return [...arr.slice(0, i), ...arr.slice(i + 1)]
      })
  },
})

export const reducer = pluginsSlice.reducer
