import { reducer, MapsState } from '../maps'
import {
  createAPIGetMemberMapinfoResponseAction,
  createAPIReqMapSelectEventmapRankResponseAction,
} from '../../actions'

import mapInfoFixture from './__fixtures__/api_get_member_mapinfo.json'
import selectEventmapRankFixture from './__fixtures__/api_req_map_select_eventmap_rank.json'

import type { GameResponsePayload } from '../../actions'
import type {
  APIGetMemberMapinfoRequest,
  APIGetMemberMapinfoResponse,
  APIReqMapSelectEventmapRankRequest,
  APIReqMapSelectEventmapRankResponse,
} from 'kcsapi'

describe('maps reducer', () => {
  it('should return initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({})
  })

  it('should return current state for unknown actions', () => {
    const currentState: MapsState = {
      '11': { api_id: 11 },
    }
    const result = reducer(currentState, { type: 'UNKNOWN_ACTION' })
    expect(result).toBe(currentState)
  })

  it('should handle api_get_member/mapinfo', () => {
    const result = reducer(
      {},
      createAPIGetMemberMapinfoResponseAction(
        mapInfoFixture as unknown as GameResponsePayload<
          APIGetMemberMapinfoResponse,
          APIGetMemberMapinfoRequest
        >,
      ),
    )
    expect(result).toMatchSnapshot()
  })

  it('should handle api_req_map/select_eventmap_rank', () => {
    const before: MapsState = reducer(
      {},
      createAPIGetMemberMapinfoResponseAction(
        mapInfoFixture as unknown as GameResponsePayload<
          APIGetMemberMapinfoResponse,
          APIGetMemberMapinfoRequest
        >,
      ),
    )
    const after = reducer(
      before,
      createAPIReqMapSelectEventmapRankResponseAction(
        selectEventmapRankFixture as unknown as GameResponsePayload<
          APIReqMapSelectEventmapRankResponse,
          APIReqMapSelectEventmapRankRequest
        >,
      ),
    )
    expect(after).toMatchDiffSnapshot(before)
  })
})
