import {combineReducers} from '../combine-reducers'
import reduceReducers from '../reduce-reducers'
import { get, pick } from 'lodash'

import {reducer as basic} from './basic'
import {reducer as ships} from './ships'
import {reducer as fleets} from './fleets'
import {reducer as equips} from './equips'
import {reducer as repairs} from './repairs'
import {reducer as constructions} from './constructions'
import {reducer as resources} from './resources'
import {reducer as maps} from './maps'
import {reducer as quests} from './quests'
import {reducer as server} from './server'
import airbase from './airbase'
import presets from './presets'

export const reducer = reduceReducers(
  (state, action) => {
    if (action.type === '@@Response/kcsapi/api_get_member/require_info') {
      const oldAdmiralId = get(state, 'basic.api_member_id')
      const admiralId = action.body.api_basic.api_member_id
      if (oldAdmiralId != admiralId) {
        return pick(state, ['basic'])
      }
    }
    return state
  },
  combineReducers({
    basic,
    ships,
    fleets,
    equips,
    repairs,
    constructions,
    resources,
    maps,
    quests,
    airbase,
    presets,
    server,
  }),
)
