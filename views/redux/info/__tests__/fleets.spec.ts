import {
  createAPIPortPortResponseAction,
  createAPIReqHenseiChangeResponseAction,
  createAPIReqMemberUpdatedecknameResponseAction,
  createAPIReqKousyouDestroyshipResponseAction,
} from 'views/redux/actions'

import type { FleetsState, Fleet } from '../fleets'

import { reducer } from '../fleets'
import apiPortPortFixture from './__fixtures__/api_port_port_typical.json'

describe('fleets reducer', () => {
  const createFleet = (id: number, ships: number[] = [-1, -1, -1, -1, -1, -1]): Fleet => ({
    api_id: id,
    api_name: `Fleet ${id}`,
    api_ship: ships,
  })

  it('should return initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual([])
  })

  it('should return current state for unknown actions', () => {
    const currentState: FleetsState = [createFleet(1, [1, 2, -1, -1, -1, -1])]
    const result = reducer(currentState, { type: 'UNKNOWN_ACTION' })
    expect(result).toBe(currentState)
  })

  it('should handle api_port/port', () => {
    const result = reducer([], createAPIPortPortResponseAction(apiPortPortFixture))
    expect(result).toMatchSnapshot()
  })

  it('should handle api_req_member/updatedeckname', () => {
    const initialState: FleetsState = [createFleet(1), createFleet(2)]
    const postBody = {
      api_deck_id: '1',
      api_name: 'New Fleet Name',
    }
    const result = reducer(
      initialState,
      createAPIReqMemberUpdatedecknameResponseAction({
        method: 'POST',
        path: '/kcsapi/api_req_member/updatedeckname',
        body: {
          api_result: 1,
          api_result_msg: 'success',
        },
        postBody: { ...postBody, api_verno: '1' },
        time: 0,
      }),
    )
    expect(result[0].api_name).toBe('New Fleet Name')
    expect(result[1].api_name).toBe('Fleet 2')
  })

  it('should handle api_req_hensei/change - remove ship', () => {
    const initialState: FleetsState = [createFleet(1, [101, 102, 103, -1, -1, -1])]
    const postBody = {
      api_id: '1',
      api_ship_idx: '1',
      api_ship_id: '-1',
      api_verno: '1',
    }
    const result = reducer(
      initialState,
      createAPIReqHenseiChangeResponseAction({
        method: 'POST',
        path: '/kcsapi/api_req_hensei/change',
        body: {
          api_result: 1,
          api_result_msg: 'success',
        },
        postBody,
        time: 0,
      }),
    )
    // After removing ship at position 1, ships should shift
    expect(result[0].api_ship).toEqual([101, 103, -1, -1, -1, -1])
  })

  it('should handle api_req_hensei/change - remove all but flagship', () => {
    const initialState: FleetsState = [createFleet(1, [101, 102, 103, 104, 105, 106])]
    const result = reducer(
      initialState,
      createAPIReqHenseiChangeResponseAction({
        method: 'POST',
        path: '/kcsapi/api_req_hensei/change',
        body: { api_result: 1, api_result_msg: 'success' },
        postBody: { api_id: '1', api_ship_idx: '1', api_ship_id: '-2', api_verno: '1' },
        time: 0,
      }),
    )
    expect(result[0].api_ship).toEqual([101, -1, -1, -1, -1, -1])
  })

  it('should handle api_req_hensei/change - swap with another fleet', () => {
    const initialState: FleetsState = [
      createFleet(1, [101, 102, -1, -1, -1, -1]),
      createFleet(2, [201, 202, -1, -1, -1, -1]),
    ]

    const result = reducer(
      initialState,
      createAPIReqHenseiChangeResponseAction({
        method: 'POST',
        path: '/kcsapi/api_req_hensei/change',
        body: { api_result: 1, api_result_msg: 'success' },
        postBody: { api_id: '1', api_ship_idx: '1', api_ship_id: '202', api_verno: '1' },
        time: 0,
      }),
    )

    expect(result[0].api_ship).toEqual([101, 202, -1, -1, -1, -1])
    expect(result[1].api_ship).toEqual([201, 102, -1, -1, -1, -1])
  })

  it('should handle api_req_kousyou/destroyship - removes from fleets', () => {
    const initialState: FleetsState = [createFleet(1, [101, 102, 103, -1, -1, -1])]
    const result = reducer(
      initialState,
      createAPIReqKousyouDestroyshipResponseAction({
        method: 'POST',
        path: '/kcsapi/api_req_kousyou/destroyship',
        body: { api_material: [0, 0, 0, 0], api_unset_list: {} },
        postBody: { api_ship_id: '102,103', api_slot_dest_flag: '0', api_verno: '1' },
        time: 0,
      }),
    )
    expect(result[0].api_ship).toEqual([101, -1, -1, -1, -1, -1])
  })
})
