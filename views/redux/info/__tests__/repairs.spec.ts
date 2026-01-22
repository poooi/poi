import { reducer, RepairsState } from '../repairs'

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
    const body = [
      {
        api_id: 1,
        api_complete_time: 1234567890,
        api_complete_time_str: '2024-01-01 00:00:00',
        api_item1: 100,
        api_item2: 0,
        api_item3: 50,
        api_item4: 0,
        api_ship_id: 123,
        api_state: 1,
      },
    ]
    const result = reducer([], { type: '@@Response/kcsapi/api_get_member/ndock', body })
    expect(result).toEqual(body)
  })

  it('should handle api_port/port', () => {
    const body = {
      api_ndock: [
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
      ],
    }
    const result = reducer([], { type: '@@Response/kcsapi/api_port/port', body })
    expect(result).toEqual(body.api_ndock)
  })
})
