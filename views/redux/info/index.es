import {combineReducers} from 'redux'

import {reducer as basic} from './basic'
import {reducer as ships} from './ships'
import {reducer as fleets} from './fleets'
import {reducer as equips} from './equips'
import {reducer as repairs} from './repairs'
import {reducer as constructions} from './constructions'
import {reducer as resources} from './resources'
import {reducer as maps} from './maps'
import {reducer as quests} from './quests'

export const reducer = combineReducers({
  basic,
  ships,
  fleets,
  equips,
  repairs,
  constructions,
  resources,
  maps,
  quests,
})
