import { sortBy } from 'lodash'
import { reduxSet } from 'views/utils/tools'

export const sortPlugins =
  ps => sortBy(ps, ['priority', 'packageName'])

export function reducer (state=[], {type, value, option}) {
  const findPluginIndexByPackageName = packageName =>
    state.findIndex(p => p.packageName === packageName)

  switch (type) {
  case '@@Plugin/initialize': {
    return value
  }
  case '@@Plugin/add': {
    const i = findPluginIndexByPackageName(value.packageName)
    if (i === -1) {
      state = state.concat(value)
    } else {
      state[i] = value
    }
    return sortPlugins(state)
  }
  case '@@Plugin/changeStatus': {
    const i = findPluginIndexByPackageName(value.packageName)
    for (const opt of option) {
      const {path, status} = opt
      state = reduxSet(state, [i].concat(path.split('.')), status)
    }
    return sortPlugins(state)
  }
  case '@@Plugin/remove': {
    const i = findPluginIndexByPackageName(value.packageName)
    if (i !== -1) {
      state = [...state]
      state.splice(i, 1)
    }
    return state
  }
  }

  return state
}
