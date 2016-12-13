import { remote } from 'electron'

import { reduxSet } from 'views/utils/tools'
const config = remote.require('./lib/config')

export function reducer(state=Object.clone(config.get('')), {type, path, value}) {
  switch (type) {
  case '@@Config':
    state = reduxSet(state, path.split('.'), value)
    return state
  default:
    return state
  }
}
