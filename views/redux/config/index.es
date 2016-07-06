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
