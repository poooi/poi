import { reducer, RepairsState } from '../repairs'
import {
  createAPIGetMemberNdockResponseAction,
  createAPIPortPortResponseAction,
} from '../../actions'

import ndockFixture from './__fixtures__/api_get_member_ndock.json'
import portFixture from './__fixtures__/api_port_port.json'

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
})
