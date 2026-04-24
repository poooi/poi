import { combineReducers } from '../combine-reducers'
import cond, { type CondState } from './cond'

export interface TimersState {
  cond: CondState
}

export const reducer = combineReducers<TimersState>({
  cond,
})
