import { reducer, MapsState } from '../maps'
import {
  createAPIGetMemberMapinfoResponseAction,
  createAPIReqMapSelectEventmapRankResponseAction,
} from '../../actions'

import mapInfoFixture from './__fixtures__/api_get_member_mapinfo_typical.json'
import selectEventmapRankFixture from './__fixtures__/api_req_map_select_eventmap_rank_sets_rank.json'

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
    const payload: GameResponsePayload<APIGetMemberMapinfoResponse, APIGetMemberMapinfoRequest> =
      mapInfoFixture
    const result = reducer({}, createAPIGetMemberMapinfoResponseAction(payload))
    expect(result).toMatchSnapshot()
  })

  it('should handle api_req_map/select_eventmap_rank', () => {
    const mapInfoPayload: GameResponsePayload<
      APIGetMemberMapinfoResponse,
      APIGetMemberMapinfoRequest
    > = mapInfoFixture
    const selectEventmapRankPayload: GameResponsePayload<
      APIReqMapSelectEventmapRankResponse,
      APIReqMapSelectEventmapRankRequest
    > = selectEventmapRankFixture
    const before: MapsState = reducer({}, createAPIGetMemberMapinfoResponseAction(mapInfoPayload))
    const after = reducer(
      before,
      createAPIReqMapSelectEventmapRankResponseAction(selectEventmapRankPayload),
    )
    expect(after).toMatchDiffSnapshot(before)
  })
})
