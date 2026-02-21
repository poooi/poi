import type { APIKdock } from 'kcsapi/api_get_member/require_info/response'
import type { APIBasic as PortAPIBasic } from 'kcsapi/api_port/port/response'

import { get, pick } from 'lodash'
import reduceReducers from 'reduce-reducers'

import type { AirBase } from './airbase'
import type { EquipsState } from './equips'
import type { FleetsState } from './fleets'
import type { MapsState } from './maps'
import type { PresetsState } from './presets'
import type { QuestsState } from './quests'
import type { RepairsState } from './repairs'
import type { ResourcesState } from './resources'
import type { ServerState } from './server'
import type { ShipsState } from './ships'
import type { UseItemsState } from './useitems'

import { combineReducers } from '../combine-reducers'
import { reducer as airbase } from './airbase'
import { reducer as basic } from './basic'
import { reducer as constructions } from './constructions'
import { reducer as equips } from './equips'
import { reducer as fleets } from './fleets'
import { reducer as maps } from './maps'
import presets from './presets'
import { reducer as quests } from './quests'
import { reducer as repairs } from './repairs'
import { reducer as resources } from './resources'
import { reducer as server } from './server'
import { reducer as ships } from './ships'
import { reducer as useitems } from './useitems'

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
  // Legacy reducers used `action.body`, RTK action creators use `action.payload.body`.
  body?: {
    api_basic?: {
      api_member_id: string | number
    }
  }
  payload?: {
    body?: {
      api_basic?: {
        api_member_id: string | number
      }
    }
  }
}

export const reducer = reduceReducers(
  (state: InfoState | undefined, action: Action): InfoState | Partial<InfoState> => {
    if (action.type === '@@Response/kcsapi/api_get_member/require_info') {
      const oldAdmiralId = get(state, 'basic.api_member_id')
      const admiralId =
        action.body?.api_basic?.api_member_id ?? action.payload?.body?.api_basic?.api_member_id
      if (oldAdmiralId != admiralId) {
        return pick(state, ['basic']) satisfies Partial<InfoState>
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
