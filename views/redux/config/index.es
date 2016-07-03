import { set, get } from 'lodash'

export function reducer(state=Object.clone(config.get('')), {type, path, value}) {
  switch (type) {
    case '@@Config':
      let newState = {...state}
      set(newState, path, value)
      return newState
      break
    default:
      return state
  }
}
