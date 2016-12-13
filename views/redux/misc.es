import { combineReducers } from 'redux'

function canNotify(state=false, {type}) {
  if (type === '@@Response/kcsapi/api_port/port')
    return true
  return state
}

export default combineReducers({
  canNotify,
})
