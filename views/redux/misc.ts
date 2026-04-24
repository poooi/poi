import { combineReducers } from './combine-reducers'

export interface MiscState {
  canNotify: boolean
}

function canNotify(state = false, { type }: { type: string }): boolean {
  if (type === '@@Response/kcsapi/api_port/port') return true
  return state
}

export default combineReducers<MiscState>({
  canNotify,
})
