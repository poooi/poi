import { remote } from 'electron'
const config = remote.require('./lib/config')

export function reducer(state=Object.clone(config.get('')), {type, path, value}) {
  const {reduxSet} = window
  switch (type) {
  case '@@Config':
    state = {...state}
    state = reduxSet(state, path.split('.'), value)
    return state
  default:
    return state
  }
}
