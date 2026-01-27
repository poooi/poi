import type { EquipsState } from 'views/redux/info/equips'

import { applyMiddleware, combineReducers, createStore } from 'redux'
import {
  createAPIReqKaisouPowerupResponseAction,
  createAPIReqKousyouDestroyshipResponseAction,
} from 'views/redux/actions'
import { reducer as equipsReducer } from 'views/redux/info/equips'

import { equipsCrossSliceMiddleware } from '../equips-cross-slice'

type PreloadedInfoState = {
  info: {
    ships: Record<string, { api_slot?: number[] }>
  }
}

function createTestStore(preloadedEquips: EquipsState, preloadedState: PreloadedInfoState) {
  const rootReducer = combineReducers({
    info: combineReducers({
      equips: equipsReducer,
      ships: (state = preloadedState.info.ships) => state,
    }),
  })

  return createStore(
    rootReducer,
    {
      ...preloadedState,
      info: {
        ...preloadedState.info,
        equips: preloadedEquips,
      },
    },
    applyMiddleware(equipsCrossSliceMiddleware),
  )
}

describe('equipsCrossSliceMiddleware', () => {
  it('removes equips for powerup when api_slot_dest_flag is set', () => {
    const store = createTestStore(
      {
        '101': { api_id: 101 },
        '102': { api_id: 102 },
        '103': { api_id: 103 },
      },
      {
        info: {
          ships: {
            '1': { api_slot: [101, 102] },
            '2': { api_slot: [103] },
          },
        },
      },
    )

    store.dispatch(
      createAPIReqKaisouPowerupResponseAction({
        method: 'POST',
        path: '/kcsapi/api_req_kaisou/powerup',
        body: {
          api_result: 1,
          api_result_msg: 'success',
        } as never,
        postBody: {
          api_slot_dest_flag: '1',
          api_id_items: '1,2',
        } as never,
        time: 0,
      }),
    )

    expect(store.getState().info.equips).toEqual({})
  })

  it('does not remove equips for powerup when api_slot_dest_flag is not set', () => {
    const store = createTestStore(
      {
        '101': { api_id: 101 },
      },
      {
        info: {
          ships: {
            '1': { api_slot: [101] },
          },
        },
      },
    )

    store.dispatch(
      createAPIReqKaisouPowerupResponseAction({
        method: 'POST',
        path: '/kcsapi/api_req_kaisou/powerup',
        body: {
          api_result: 1,
          api_result_msg: 'success',
        } as never,
        postBody: {
          api_slot_dest_flag: '0',
          api_id_items: '1',
        } as never,
        time: 0,
      }),
    )

    expect(store.getState().info.equips).toEqual({ '101': { api_id: 101 } })
  })

  it('removes equips for destroyship when api_slot_dest_flag is set', () => {
    const store = createTestStore(
      {
        '201': { api_id: 201 },
        '202': { api_id: 202 },
      },
      {
        info: {
          ships: {
            '10': { api_slot: [201] },
            '20': { api_slot: [202] },
          },
        },
      },
    )

    store.dispatch(
      createAPIReqKousyouDestroyshipResponseAction({
        method: 'POST',
        path: '/kcsapi/api_req_kousyou/destroyship',
        body: {
          api_result: 1,
          api_result_msg: 'success',
        } as never,
        postBody: {
          api_slot_dest_flag: '1',
          api_ship_id: '10,20',
        } as never,
        time: 0,
      }),
    )

    expect(store.getState().info.equips).toEqual({})
  })
})
