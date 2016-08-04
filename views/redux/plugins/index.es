import { sortBy } from 'lodash'

import { getPluginIndexByPackageName } from './utils'

export function reducer (state=[], {type, value, option}) {
  const {reduxSet} = window
  switch (type) {
  case '@@Plugin/initialize': {
    return value
  }
  case '@@Plugin/add': {
    const i = getPluginIndexByPackageName(state, value.packageName)
    if (i === -1) {
      state = state.concat(value)
    } else {
      state[i] = value
    }
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
    state = sortBy(state, 'priority')
    return state
  }
  case '@@Plugin/remove': {
    state = [...state]
    const i = getPluginIndexByPackageName(state, value.packageName)
    state.splice(i, 1)
    return state
  }
  default:
    return state
  }
}
