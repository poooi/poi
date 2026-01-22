import { reducer, UseItemsState } from '../useitems'

describe('useitems reducer', () => {
  it('should return initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({})
  })

  it('should return current state for unknown actions', () => {
    const currentState: UseItemsState = {
      '1': { api_id: 1, api_count: 10 },
    }
    const result = reducer(currentState, { type: 'UNKNOWN_ACTION' })
    expect(result).toBe(currentState)
  })

  it('should handle api_get_member/require_info', () => {
    const body = {
      api_useitem: [
        { api_id: 1, api_count: 10 },
        { api_id: 2, api_count: 20 },
      ],
    }
    const result = reducer({}, { type: '@@Response/kcsapi/api_get_member/require_info', body })
    expect(result).toEqual({
      '1': { api_id: 1, api_count: 10 },
      '2': { api_id: 2, api_count: 20 },
    })
  })

  it('should handle api_get_member/useitem', () => {
    const body = [
      { api_id: 1, api_count: 15 },
      { api_id: 3, api_count: 5 },
    ]
    const result = reducer({}, { type: '@@Response/kcsapi/api_get_member/useitem', body })
    expect(result).toEqual({
      '1': { api_id: 1, api_count: 15 },
      '3': { api_id: 3, api_count: 5 },
    })
  })
})
