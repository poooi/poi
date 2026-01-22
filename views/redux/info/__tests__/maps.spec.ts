import { reducer, MapsState } from '../maps'

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
    const body = {
      api_map_info: [
        { api_id: 11, api_cleared: 1 },
        { api_id: 12, api_cleared: 0 },
      ],
    }
    const result = reducer({}, { type: '@@Response/kcsapi/api_get_member/mapinfo', body })
    expect(result).toEqual({
      '11': { api_id: 11, api_cleared: 1 },
      '12': { api_id: 12, api_cleared: 0 },
    })
  })

  it('should handle api_req_map/select_eventmap_rank', () => {
    const initialState: MapsState = {
      '351': { api_id: 351 },
    }
    const body = {
      api_maphp: { api_max_maphp: 5000, api_now_maphp: 5000 },
    }
    const postBody = {
      api_maparea_id: '35',
      api_map_no: '1',
      api_rank: '2',
    }
    const result = reducer(initialState, {
      type: '@@Response/kcsapi/api_req_map/select_eventmap_rank',
      body,
      postBody,
    })
    expect(result['351']).toMatchObject({
      api_eventmap: {
        api_selected_rank: 2,
        api_max_maphp: 5000,
        api_now_maphp: 5000,
      },
    })
  })
})
