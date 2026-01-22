import { combineReducers } from '../combine-reducers'
import reduceReducers from 'reduce-reducers'
import { get, pick } from 'lodash'

import { reducer as basic } from './basic'
import { reducer as ships, ShipsState } from './ships'
import { reducer as fleets, FleetsState } from './fleets'
import { reducer as equips, EquipsState } from './equips'
import { reducer as repairs, RepairsState } from './repairs'
import { reducer as constructions } from './constructions'
import { reducer as resources, ResourcesState } from './resources'
import { reducer as maps, MapsState } from './maps'
import { reducer as quests, QuestsState } from './quests'
import { reducer as server, ServerState } from './server'
import { reducer as useitems, UseItemsState } from './useitems'
import { reducer as airbase, AirBase } from './airbase'
import presets, { PresetsState } from './presets'
import { APIBasic as PortAPIBasic } from 'kcsapi/api_port/port/response'
import { APIKdock } from 'kcsapi/api_get_member/require_info/response'

export interface InfoState {
  basic: Partial<PortAPIBasic>
  ships: ShipsState
  fleets: FleetsState
  equips: EquipsState
  repairs: RepairsState
  constructions: APIKdock[]
  resources: ResourcesState
  maps: MapsState
  quests: QuestsState
  airbase: AirBase[]
  presets: PresetsState
  server: ServerState
  useitems: UseItemsState
}

interface Action {
  type: string
  body?: {
    api_basic?: {
      api_member_id: string | number
    }
  }
}

export const reducer = reduceReducers(
  (state: InfoState | undefined, action: Action): InfoState | Partial<InfoState> => {
    if (action.type === '@@Response/kcsapi/api_get_member/require_info') {
      const oldAdmiralId = get(state, 'basic.api_member_id')
      const admiralId = action.body?.api_basic?.api_member_id
      if (oldAdmiralId != admiralId) {
        return pick(state, ['basic']) as Partial<InfoState>
      }
    }
    return state || ({} as InfoState)
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
    useitems,
  }),
)
