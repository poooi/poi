import type { APIReqNyukyoSpeedchangeRequest, APIReqNyukyoSpeedchangeResponse } from 'kcsapi'
import type { GameResponsePayload } from 'views/redux/actions'

import {
  createAPIReqNyukyoSpeedchangeResponseAction,
  createInfoShipsRepairCompletedAction,
} from 'views/redux/actions'

import speedchangeFixture from '../../info/__tests__/__fixtures__/api_req_nyukyo_speedchange_use_bucket.json'
import { shipsCrossSliceMiddleware } from '../ships-cross-slice'

describe('shipsCrossSliceMiddleware', () => {
  it('dispatches RepairCompleted for nyukyo/speedchange based on repairs state', () => {
    type TestStore = {
      getState: () => unknown
      dispatch: jest.Mock
    }

    const store = {
      getState: () => ({
        info: {
          repairs: [{ api_ship_id: 0 }, { api_ship_id: 123 }],
        },
      }),
      dispatch: jest.fn(),
    } satisfies TestStore

    const next = jest.fn()

    shipsCrossSliceMiddleware(store satisfies TestStore as TestStore)(next)(
      createAPIReqNyukyoSpeedchangeResponseAction(
        speedchangeFixture satisfies GameResponsePayload<
          APIReqNyukyoSpeedchangeResponse,
          APIReqNyukyoSpeedchangeRequest
        >,
      ),
    )

    expect(store.dispatch).toHaveBeenCalledWith(
      createInfoShipsRepairCompletedAction({ api_ship_id: 123 }),
    )
    expect(next).toHaveBeenCalled()
  })

  it('does not dispatch when dock is missing from state', () => {
    type TestStore = {
      getState: () => unknown
      dispatch: jest.Mock
    }

    const store = {
      getState: () => ({
        info: {
          repairs: [],
        },
      }),
      dispatch: jest.fn(),
    } satisfies TestStore

    const next = jest.fn()

    shipsCrossSliceMiddleware(store satisfies TestStore as TestStore)(next)(
      createAPIReqNyukyoSpeedchangeResponseAction(
        speedchangeFixture satisfies GameResponsePayload<
          APIReqNyukyoSpeedchangeResponse,
          APIReqNyukyoSpeedchangeRequest
        >,
      ),
    )

    expect(store.dispatch).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })
})
