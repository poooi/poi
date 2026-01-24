import type { Middleware } from 'redux'

import { battleActions } from '../battle'

type AnyAction = {
  type: string
  path?: string
  body?: unknown
  postBody?: unknown
  time?: number
}

export const battleSliceMiddleware: Middleware = (store) => (next) => (action) => {
  const a = action as AnyAction

  switch (a.type) {
    case '@@Response/kcsapi/api_port/port':
      store.dispatch(battleActions.port())
      break

    case '@@Response/kcsapi/api_req_map/start':
      store.dispatch(
        battleActions.mapStart({
          body: a.body,
          postBody: a.postBody,
        }),
      )
      break

    case '@@Response/kcsapi/api_req_map/next':
      store.dispatch(battleActions.mapNext({ body: a.body }))
      break

    case '@@Response/kcsapi/api_req_sortie/battle':
    case '@@Response/kcsapi/api_req_sortie/airbattle':
    case '@@Response/kcsapi/api_req_sortie/ld_airbattle':
    case '@@Response/kcsapi/api_req_combined_battle/battle':
    case '@@Response/kcsapi/api_req_combined_battle/battle_water':
    case '@@Response/kcsapi/api_req_combined_battle/airbattle':
    case '@@Response/kcsapi/api_req_combined_battle/ld_airbattle':
    case '@@Response/kcsapi/api_req_combined_battle/ec_battle':
    case '@@Response/kcsapi/api_req_combined_battle/each_battle':
    case '@@Response/kcsapi/api_req_combined_battle/each_battle_water':
    case '@@Response/kcsapi/api_req_battle_midnight/battle':
    case '@@Response/kcsapi/api_req_battle_midnight/sp_midnight':
    case '@@Response/kcsapi/api_req_combined_battle/midnight_battle':
    case '@@Response/kcsapi/api_req_combined_battle/sp_midnight':
    case '@@Response/kcsapi/api_req_combined_battle/ec_midnight_battle':
    case '@@Response/kcsapi/api_req_combined_battle/ec_night_to_day':
      store.dispatch(
        battleActions.battle({
          body: a.body,
          path: a.path,
          time: a.time,
          rootState: store.getState() as unknown,
        }),
      )
      break

    case '@@Response/kcsapi/api_req_sortie/battleresult':
    case '@@Response/kcsapi/api_req_combined_battle/battleresult':
      store.dispatch(
        battleActions.battleResult({
          body: a.body,
          rootState: store.getState() as unknown,
        }),
      )
      break
  }

  return next(action)
}
