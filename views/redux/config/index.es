import {isEqual} from 'lodash'

function reduxSet(obj, path, val) {
  const [prop, ...restPath] = path
  if (typeof prop === 'undefined') {
    if (!isEqual(obj, val))
      return val
    else
      return obj
  }
  let before
  if (prop in obj) {
    before = obj[prop]
  } else {
    before = {}
  }
  const after = reduxSet(before, restPath, val)
  if (after !== before) {
    let result
    if (Array.isArray(obj)) {
      result = obj.slice()
      result[prop] = after
    } else {
      result = {
        ...obj,
        [prop]: after,
      }
    }
    return result
  }
  return obj
}

export function reducer(state=Object.clone(config.get('')), {type, path, value}) {
  switch (type) {
    case '@@Config':
      let newState = {...state}
      newState = reduxSet(newState, path.split('.'), value)
      return newState
      break
    default:
      return state
  }
}
