import { reducer, ResourcesState } from '../resources'

describe('resources reducer', () => {
  it('should return initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual([])
  })

  it('should return current state for unknown actions', () => {
    const currentState: ResourcesState = [1000, 1000, 1000, 1000, 100, 100, 100, 100]
    const result = reducer(currentState, { type: 'UNKNOWN_ACTION' })
    expect(result).toBe(currentState)
  })

  it('should handle api_port/port', () => {
    const body = {
      api_material: [
        { api_value: 10000 },
        { api_value: 10000 },
        { api_value: 10000 },
        { api_value: 10000 },
        { api_value: 100 },
        { api_value: 200 },
        { api_value: 300 },
        { api_value: 50 },
      ],
    }
    const result = reducer([], { type: '@@Response/kcsapi/api_port/port', body })
    expect(result).toEqual([10000, 10000, 10000, 10000, 100, 200, 300, 50])
  })

  it('should handle api_get_member/material', () => {
    const body = [
      { api_value: 5000 },
      { api_value: 6000 },
      { api_value: 7000 },
      { api_value: 8000 },
      { api_value: 50 },
      { api_value: 100 },
      { api_value: 150 },
      { api_value: 25 },
    ]
    const result = reducer([], { type: '@@Response/kcsapi/api_get_member/material', body })
    expect(result).toEqual([5000, 6000, 7000, 8000, 50, 100, 150, 25])
  })

  it('should handle api_req_nyukyo/speedchange', () => {
    const currentState: ResourcesState = [1000, 1000, 1000, 1000, 100, 100, 100, 100]
    const result = reducer(currentState, { type: '@@Response/kcsapi/api_req_nyukyo/speedchange' })
    expect(result[5]).toBe(99) // Bucket decremented by 1
  })
})
