import { sortBy } from 'lodash'

import { getPluginIndexByPackageName } from './utils'

export function reducer (state=[], {type, value, option}) {
  const {reduxSet} = window
  switch (type) {
  case '@@Plugin/initaialize': {
    return value
  }
  case '@@Plugin/replace': {
    state = [...state]
    const i = getPluginIndexByPackageName(state, value.packageName)
    state = reduxSet(state, [i], value)
    state = sortBy(state, 'priority')
    return state
  }
  case '@@Plugin/changeStatus': {
    state = [...state]
    const i = getPluginIndexByPackageName(state, value.packageName)
    for (const opt of option) {
      const {path, status} = opt
      state = reduxSet(state, [i].concat(path.split('.')), status)
    }
    return state
  }
  case '@@Plugin/remove': {
    state = [...state]
    const i = getPluginIndexByPackageName(state, value.packageName)
    state.splice(i, 1)
    return state
  }
  case '@@Plugin/add': {
    state = [...state]
    state.push(value)
    state = sortBy(state, 'priority')
    return state
  }
  default:
    return state
  }
}
