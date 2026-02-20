import type {
  APIGetMemberKdockRequest,
  APIGetMemberKdockResponse,
  APIGetMemberRequireInfoRequest,
  APIGetMemberRequireInfoResponse,
  APIReqKousyouCreateshipSpeedchangeRequest,
  APIReqKousyouCreateshipSpeedchangeResponse,
} from 'kcsapi'
import type { GameResponsePayload } from 'views/redux/actions'

import {
  createAPIGetMemberKdockResponseAction,
  createAPIGetMemberRequireInfoAction,
  createAPIReqKousyouCreateShipSpeedChangeResponseAction,
  createAPIReqKousyouGetShipResponseAction,
} from 'views/redux/actions'

import { reducer } from '../constructions'
import kdockFixture from './__fixtures__/api_get_member_kdock_mixed_states.json'
import requireInfoKdockFixture from './__fixtures__/api_get_member_require_info_includes_kdock.json'
import speedchangeFixture from './__fixtures__/api_req_kousyou_createship_speedchange_kdock2_complete.json'
import getShipFixture from './__fixtures__/api_req_kousyou_getship_receive_new_ship.json'

describe('constructions reducer', () => {
  it('should return initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual([])
  })

  it('should return current state for unknown actions', () => {
    const currentState = [
      {
        api_id: 1,
        api_state: 0,
        api_created_ship_id: 0,
        api_complete_time: 0,
        api_complete_time_str: '0',
        api_item1: 0,
        api_item2: 0,
        api_item3: 0,
        api_item4: 0,
        api_item5: 0,
      },
    ]
    const result = reducer(currentState, { type: 'UNKNOWN_ACTION' })
    expect(result).toBe(currentState)
  })

  it('should handle api_get_member/require_info', () => {
    const payload: GameResponsePayload<
      APIGetMemberRequireInfoResponse,
      APIGetMemberRequireInfoRequest
    > = requireInfoKdockFixture satisfies GameResponsePayload<
      APIGetMemberRequireInfoResponse,
      APIGetMemberRequireInfoRequest
    >
    const result = reducer([], createAPIGetMemberRequireInfoAction(payload))
    expect(result).toEqual(payload.body.api_kdock)
  })

  it('should handle api_req_kousyou/getship', () => {
    expect(reducer([], createAPIReqKousyouGetShipResponseAction(getShipFixture))).toEqual(
      getShipFixture.body.api_kdock,
    )
  })

  it('should handle api_get_member/kdock', () => {
    const payload: GameResponsePayload<APIGetMemberKdockResponse[], APIGetMemberKdockRequest> =
      kdockFixture
    const result = reducer([], createAPIGetMemberKdockResponseAction(payload))
    expect(result).toEqual(payload.body)
  })

  it('should handle api_req_kousyou/createship_speedchange', () => {
    const initial = [
      {
        api_id: 1,
        api_state: 0,
        api_created_ship_id: 0,
        api_complete_time: 123,
        api_complete_time_str: 'x',
        api_item1: 0,
        api_item2: 0,
        api_item3: 0,
        api_item4: 0,
        api_item5: 0,
      },
      {
        api_id: 2,
        api_state: 2,
        api_created_ship_id: 0,
        api_complete_time: 456,
        api_complete_time_str: 'y',
        api_item1: 0,
        api_item2: 0,
        api_item3: 0,
        api_item4: 0,
        api_item5: 0,
      },
    ]

    const payload: GameResponsePayload<
      APIReqKousyouCreateshipSpeedchangeResponse,
      APIReqKousyouCreateshipSpeedchangeRequest
    > = speedchangeFixture
    const result = reducer(initial, createAPIReqKousyouCreateShipSpeedChangeResponseAction(payload))

    expect(result[1]).toEqual(
      expect.objectContaining({
        api_complete_time: 0,
        api_complete_time_str: '0',
        api_state: 3,
      }),
    )
  })
})
