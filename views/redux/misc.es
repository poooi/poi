import { combineReducers } from './combine-reducers'

function canNotify(state = false, { type }) {
  if (type === '@@Response/kcsapi/api_port/port') return true
  return state
}

// use for update views depending on kckit checkers
const kckitRevision = (state = 0, { type }) => (type === '@@misc-kckit-bump' ? state + 1 : state)

export default combineReducers({
  canNotify,
  kckitRevision,
})
