import type { Plugin } from 'views/services/plugin-manager/utils'

import { sortBy } from 'lodash-es'
import { reduxSet } from 'views/utils/tools'

import type { PoiReducer } from '../combine-reducers'

export const sortPlugins = (ps: Plugin[]): Plugin[] => sortBy(ps, ['priority', 'packageName'])

type PluginAction =
  | { type: '@@Plugin/initialize'; value: Plugin[] }
  | { type: '@@Plugin/add'; value: Plugin }
  | {
      type: '@@Plugin/changeStatus'
      value: { packageName: string }
      option: Array<{ path: keyof Plugin; status: boolean }>
    }
  | { type: '@@Plugin/remove'; value: { packageName: string } }

export const reducer: PoiReducer<Plugin[], PluginAction> = (
  state: Plugin[] = [],
  action: PluginAction,
): Plugin[] => {
  const findPluginIndexByPackageName = (packageName: string): number =>
    state.findIndex((p) => p.packageName === packageName)

  switch (action.type) {
    case '@@Plugin/initialize': {
      return action.value
    }
    case '@@Plugin/add': {
      const i = findPluginIndexByPackageName(action.value.packageName)
      if (i === -1) {
        state = state.concat(action.value)
      } else {
        state = [...state]
        state[i] = action.value
      }
      return sortPlugins(state)
    }
    case '@@Plugin/changeStatus': {
      const i = findPluginIndexByPackageName(action.value.packageName)
      if (!state[i]) {
        return state
      }
      let pluginToUpdate = { ...state[i] }
      for (const opt of action.option) {
        const { path, status } = opt
        // @ts-expect-error force type assertion
        pluginToUpdate = reduxSet(pluginToUpdate, path.split('.'), status)
      }
      state = [...state.slice(0, i), pluginToUpdate, ...state.slice(i + 1)]
      return sortPlugins(state)
    }
    case '@@Plugin/remove': {
      const i = findPluginIndexByPackageName(action.value.packageName)
      if (i !== -1) {
        state = [...state]
        state.splice(i, 1)
      }
      return state
    }
    default:
      return state
  }
}
