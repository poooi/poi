const set = (target, path, value) => {
  let nowLevel = path.split('.', 1)[0]
  let nowObj = Object.clone(target[nowLevel])
  if (path.split('.').length === 1) {
    nowObj = value
  } else {
    let arr = path.split('.')
    arr.shift()
    nowObj = set(nowObj, arr.join('.'), value)
  }
  target[nowLevel] = nowObj
  return target
}

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
