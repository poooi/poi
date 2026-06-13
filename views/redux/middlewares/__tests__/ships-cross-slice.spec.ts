import type { APIReqNyukyoSpeedchangeRequest, APIReqNyukyoSpeedchangeResponse } from 'kcsapi'
import type { Dispatch, MiddlewareAPI, UnknownAction } from 'redux'
import type { GameResponsePayload } from 'views/redux/actions'
import type { RootState } from 'views/redux/reducer-factory'

import {
  createAPIReqNyukyoSpeedchangeResponseAction,
  createInfoShipsRepairCompletedAction,
} from 'views/redux/actions'

import speedchangeFixture from '../../info/__tests__/__fixtures__/api_req_nyukyo_speedchange_use_bucket.json'
import { shipsCrossSliceMiddleware } from '../ships-cross-slice'

type TestStore = MiddlewareAPI<Dispatch<UnknownAction> & jest.Mock, RootState>

// The middleware only reads info.repairs[].api_ship_id; the rest of RootState is irrelevant.
const createTestStore = (repairs: { api_ship_id: number }[]): TestStore => ({
  // @ts-expect-error minimal fixture: only info.repairs is read by this middleware
  getState: () => ({ info: { repairs } }),
  dispatch: jest.fn(),
})

const speedchangeAction = createAPIReqNyukyoSpeedchangeResponseAction(
  speedchangeFixture satisfies GameResponsePayload<
    APIReqNyukyoSpeedchangeResponse,
    APIReqNyukyoSpeedchangeRequest
  >,
)

describe('shipsCrossSliceMiddleware', () => {
  it('dispatches RepairCompleted for nyukyo/speedchange based on repairs state', () => {
    const store = createTestStore([{ api_ship_id: 0 }, { api_ship_id: 123 }])
    const next = jest.fn()

    shipsCrossSliceMiddleware(store)(next)(speedchangeAction)

    expect(store.dispatch).toHaveBeenCalledWith(
      createInfoShipsRepairCompletedAction({ api_ship_id: 123 }),
    )
    expect(next).toHaveBeenCalled()
  })

  it('does not dispatch when dock is missing from state', () => {
    const store = createTestStore([])
    const next = jest.fn()

    shipsCrossSliceMiddleware(store)(next)(speedchangeAction)

    expect(store.dispatch).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })
})
