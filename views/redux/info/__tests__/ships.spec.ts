import { reducer, ShipsState, Ship } from '../ships'

describe('ships reducer', () => {
  const createShip = (id: number, shipId: number): Ship => ({
    api_id: id,
    api_ship_id: shipId,
    api_nowhp: 30,
    api_maxhp: 30,
    api_cond: 49,
    api_ndock_time: 0,
    api_slot: [-1, -1, -1, -1, -1],
    api_locked: 0,
  })

  it('should return initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({})
  })

  it('should return current state for unknown actions', () => {
    const currentState: ShipsState = {
      '1': createShip(1, 100),
    }
    const result = reducer(currentState, { type: 'UNKNOWN_ACTION' })
    expect(result).toBe(currentState)
  })

  it('should handle api_port/port', () => {
    const body = {
      api_ship: [createShip(1, 100), createShip(2, 200)],
    }
    const result = reducer({}, { type: '@@Response/kcsapi/api_port/port', body })
    expect(result).toEqual({
      '1': createShip(1, 100),
      '2': createShip(2, 200),
    })
  })

  it('should handle api_req_hensei/lock', () => {
    const initialState: ShipsState = {
      '1': createShip(1, 100),
    }
    const postBody = {
      api_ship_id: '1',
    }
    const body = {
      api_locked: 1,
    }
    const result = reducer(initialState, {
      type: '@@Response/kcsapi/api_req_hensei/lock',
      body,
      postBody,
    })
    expect(result['1'].api_locked).toBe(1)
  })

  it('should handle api_req_kousyou/destroyship', () => {
    const initialState: ShipsState = {
      '1': createShip(1, 100),
      '2': createShip(2, 200),
      '3': createShip(3, 300),
    }
    const postBody = {
      api_ship_id: '1,3',
    }
    const result = reducer(initialState, {
      type: '@@Response/kcsapi/api_req_kousyou/destroyship',
      postBody,
    })
    expect(result).toEqual({
      '2': createShip(2, 200),
    })
  })

  it('should handle api_req_kousyou/getship', () => {
    const initialState: ShipsState = {}
    const body = {
      api_ship: createShip(999, 123),
    }
    const result = reducer(initialState, {
      type: '@@Response/kcsapi/api_req_kousyou/getship',
      body,
    })
    expect(result['999']).toEqual(createShip(999, 123))
  })

  it('should handle @@info.ships@RepairCompleted', () => {
    const damagedShip = {
      ...createShip(1, 100),
      api_nowhp: 10,
      api_cond: 30,
      api_ndock_time: 10000,
    }
    const initialState: ShipsState = {
      '1': damagedShip,
    }
    const body = {
      api_ship_id: 1,
    }
    const result = reducer(initialState, {
      type: '@@info.ships@RepairCompleted',
      body,
    })
    expect(result['1'].api_nowhp).toBe(damagedShip.api_maxhp)
    expect(result['1'].api_cond).toBe(40) // Max of 40 and original cond
    expect(result['1'].api_ndock_time).toBe(0)
  })
})
