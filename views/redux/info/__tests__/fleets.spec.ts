import { reducer, FleetsState, Fleet } from '../fleets'

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
    const body = {
      api_deck_port: [
        createFleet(1, [101, 102, -1, -1, -1, -1]),
        createFleet(2, [201, -1, -1, -1, -1, -1]),
      ],
    }
    const result = reducer([], { type: '@@Response/kcsapi/api_port/port', body })
    expect(result).toHaveLength(2)
    expect(result[0].api_ship).toEqual([101, 102, -1, -1, -1, -1])
    expect(result[1].api_ship).toEqual([201, -1, -1, -1, -1, -1])
  })

  it('should handle api_req_member/updatedeckname', () => {
    const initialState: FleetsState = [createFleet(1), createFleet(2)]
    const postBody = {
      api_deck_id: '1',
      api_name: 'New Fleet Name',
    }
    const result = reducer(initialState, {
      type: '@@Response/kcsapi/api_req_member/updatedeckname',
      postBody,
    })
    expect(result[0].api_name).toBe('New Fleet Name')
    expect(result[1].api_name).toBe('Fleet 2')
  })

  it('should handle api_req_hensei/change - remove ship', () => {
    const initialState: FleetsState = [createFleet(1, [101, 102, 103, -1, -1, -1])]
    const postBody = {
      api_id: '1',
      api_ship_idx: '1',
      api_ship_id: '-1',
    }
    const result = reducer(initialState, {
      type: '@@Response/kcsapi/api_req_hensei/change',
      postBody,
    })
    // After removing ship at position 1, ships should shift
    expect(result[0].api_ship).toEqual([101, 103, -1, -1, -1, -1])
  })
})
