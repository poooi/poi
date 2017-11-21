
import { mapValues, omit } from 'lodash'

const INIT_STATE = {}

export const reducer = (state = INIT_STATE, {type, value: { scope, opts, keys } = {} }) => {
  switch(type) {
  case '@@registerIPC': {
    return {
      ...state,
      [scope]: mapValues(opts, () => true),
    }
  }
  case '@@unregisterIPC': {
    return {
      ...state,
      [scope]: omit(state[scope], keys),
    }
  }
  case '@@unregisterAllIPC': {
    return omit(state, scope)
  }
  }
  return state
}
