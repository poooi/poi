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
    const i = getPluginIndexByPackageName(state, value.packageName)
    for (const opt of option) {
      const {path, status} = opt
      state = reduxSet(state, `${i}.${path}`, status)
    }
    state = sortBy(state, 'priority')
    return state
  }
  case '@@Plugin/remove': {
    const i = getPluginIndexByPackageName(state, value.packageName)
    if (i !== -1) {
      state = [...state]
      state.splice(i, 1)
      return state
    }
    break
  }
  default:
    return state
  }
}
