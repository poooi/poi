import { reducer, RepairsState } from '../repairs'
import {
  createAPIGetMemberNdockResponseAction,
  createAPIPortPortResponseAction,
  createAPIReqNyukyoSpeedchangeResponseAction,
} from '../../actions'

import ndockFixture from './__fixtures__/api_get_member_ndock_one_active_dock.json'
import portFixture from './__fixtures__/api_port_port_typical.json'

import speedchangeFixture from './__fixtures__/api_req_nyukyo_speedchange_use_bucket.json'

import type { GameResponsePayload } from '../../actions'
import type {
  APIGetMemberNdockRequest,
  APIGetMemberNdockResponse,
  APIPortPortRequest,
  APIPortPortResponse,
} from 'kcsapi'

describe('repairs reducer', () => {
  it('should return initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual([])
  })

  it('should return current state for unknown actions', () => {
    const currentState: RepairsState = [
      {
        api_id: 1,
        api_complete_time: 0,
        api_complete_time_str: '0',
        api_item1: 0,
        api_item2: 0,
        api_item3: 0,
        api_item4: 0,
        api_ship_id: 0,
        api_state: 0,
      },
    ]
    const result = reducer(currentState, { type: 'UNKNOWN_ACTION' })
    expect(result).toBe(currentState)
  })

  it('should handle api_get_member/ndock', () => {
    const payload: GameResponsePayload<APIGetMemberNdockResponse[], APIGetMemberNdockRequest> =
      ndockFixture
    const result = reducer([], createAPIGetMemberNdockResponseAction(payload))
    expect(result).toMatchSnapshot()
  })

  it('should handle api_port/port', () => {
    const payload: GameResponsePayload<APIPortPortResponse, APIPortPortRequest> = portFixture
    const result = reducer([], createAPIPortPortResponseAction(payload))
    expect(result).toMatchSnapshot()
  })

  it('should handle api_req_nyukyo/speedchange - preserves id fields', () => {
    const before: RepairsState = [
      {
        api_id: 1,
        api_member_id: 100,
        api_complete_time: 1,
        api_complete_time_str: '1',
        api_item1: 1,
        api_item2: 1,
        api_item3: 1,
        api_item4: 1,
        api_ship_id: 101,
        api_state: 1,
      },
      {
        api_id: 2,
        api_member_id: 100,
        api_complete_time: 2,
        api_complete_time_str: '2',
        api_item1: 2,
        api_item2: 2,
        api_item3: 2,
        api_item4: 2,
        api_ship_id: 102,
        api_state: 1,
      },
    ]

    const result = reducer(before, createAPIReqNyukyoSpeedchangeResponseAction(speedchangeFixture))

    expect(result[1]).toEqual(
      expect.objectContaining({
        api_id: 2,
        api_member_id: 100,
        api_complete_time: 0,
        api_complete_time_str: '0',
        api_item1: 0,
        api_item2: 0,
        api_item3: 0,
        api_item4: 0,
        api_ship_id: 0,
        api_state: 0,
      }),
    )
  })
})
