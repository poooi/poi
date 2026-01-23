import { applyMiddleware, combineReducers, createStore } from 'redux'

import {
  createAPIReqKousyouCreateShipSpeedChangeResponseAction,
  createAPIReqNyukyoStartResponseAction,
} from 'views/redux/actions'
import { reducer as resourcesReducer, ResourcesState } from 'views/redux/info/resources'

import { resourcesCrossSliceMiddleware } from '../../middlewares/resources-cross-slice'

type PreloadedInfoState = {
  info: {
    constructions: Array<{ api_item1?: number }>
    ships: Record<string, { api_ndock_item?: [number, number] }>
  }
}

function createTestStore(preloadedResources: ResourcesState, preloadedState: PreloadedInfoState) {
  const rootReducer = combineReducers({
    info: combineReducers({
      resources: resourcesReducer,
      constructions: (state = preloadedState.info.constructions) => state,
      ships: (state = preloadedState.info.ships) => state,
    }),
  })

  return createStore(
    rootReducer,
    {
      ...preloadedState,
      info: {
        ...preloadedState.info,
        resources: preloadedResources,
      },
    },
    applyMiddleware(resourcesCrossSliceMiddleware),
  )
}

describe('resourcesCrossSliceMiddleware', () => {
  it('applies LSC instant-build cost for createship_speedchange', () => {
    const store = createTestStore([0, 0, 0, 0, 20, 0, 0, 0], {
      info: {
        constructions: [{ api_item1: 2000 }],
        ships: {},
      },
    })

    store.dispatch(
      createAPIReqKousyouCreateShipSpeedChangeResponseAction({
        method: 'POST',
        path: '/kcsapi/api_req_kousyou/createship_speedchange',
        body: {
          api_result: 1,
          api_result_msg: 'success',
        } as never,
        postBody: {
          api_kdock_id: '1',
        } as never,
        time: 0,
      }),
    )

    expect(store.getState().info.resources).toEqual([0, 0, 0, 0, 10, 0, 0, 0])
  })

  it('applies repair costs for nyukyo/start', () => {
    const store = createTestStore([100, 0, 100, 0, 0, 5, 0, 0], {
      info: {
        constructions: [],
        ships: {
          '123': {
            api_ndock_item: [30, 40],
          },
        },
      },
    })

    store.dispatch(
      createAPIReqNyukyoStartResponseAction({
        method: 'POST',
        path: '/kcsapi/api_req_nyukyo/start',
        body: {
          api_result: 1,
          api_result_msg: 'success',
        } as never,
        postBody: {
          api_ship_id: '123',
          api_highspeed: '1',
        } as never,
        time: 0,
      }),
    )

    expect(store.getState().info.resources).toEqual([70, 0, 60, 0, 0, 4, 0, 0])
  })
})
