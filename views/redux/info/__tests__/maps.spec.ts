import type {
  APIGetMemberMapinfoRequest,
  APIGetMemberMapinfoResponse,
  APIReqMapSelectEventmapRankRequest,
  APIReqMapSelectEventmapRankResponse,
  APIReqMapStartRequest,
  APIReqMapStartResponse,
} from 'kcsapi'

import type { GameResponsePayload } from '../../actions'
import type { MapsState } from '../maps'

import {
  createAPIGetMemberMapinfoResponseAction,
  createAPIReqMapSelectEventmapRankResponseAction,
  createAPIReqMapStartResponseAction,
} from '../../actions'
import { reducer } from '../maps'
import mapInfoFixture from './__fixtures__/api_get_member_mapinfo_typical.json'
import selectEventmapRankFixture from './__fixtures__/api_req_map_select_eventmap_rank_sets_rank.json'
import startFixture from './__fixtures__/api_req_map_start_updates_event_gauge_hp.json'

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

  it('should handle api_req_map/start - event gauge hp', () => {
    const startPayload: GameResponsePayload<APIReqMapStartResponse, APIReqMapStartRequest> =
      startFixture
    const result = reducer({}, createAPIReqMapStartResponseAction(startPayload))
    const key = `${startPayload.postBody.api_maparea_id}${startPayload.postBody.api_mapinfo_no}`
    expect(result[key]?.api_eventmap?.api_max_maphp).toBeDefined()
    expect(result[key]?.api_eventmap?.api_now_maphp).toBeDefined()
  })
})
