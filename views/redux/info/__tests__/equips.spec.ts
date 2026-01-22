import { reducer, EquipsState, Equip } from '../equips'

describe('equips reducer', () => {
  const createEquip = (id: number, slotitemId: number): Equip => ({
    api_id: id,
    api_slotitem_id: slotitemId,
  })

  it('should return initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({})
  })

  it('should return current state for unknown actions', () => {
    const currentState: EquipsState = {
      '1': createEquip(1, 1),
    }
    const result = reducer(currentState, { type: 'UNKNOWN_ACTION' })
    expect(result).toBe(currentState)
  })

  it('should handle api_get_member/slot_item', () => {
    const body = [createEquip(1, 1), createEquip(2, 5)]
    const result = reducer({}, { type: '@@Response/kcsapi/api_get_member/slot_item', body })
    expect(result).toEqual({
      '1': createEquip(1, 1),
      '2': createEquip(2, 5),
    })
  })

  it('should handle api_get_member/require_info', () => {
    const body = {
      api_slot_item: [createEquip(10, 100), createEquip(20, 200)],
    }
    const result = reducer({}, { type: '@@Response/kcsapi/api_get_member/require_info', body })
    expect(result).toEqual({
      '10': createEquip(10, 100),
      '20': createEquip(20, 200),
    })
  })

  it('should handle api_req_kousyou/destroyitem2', () => {
    const initialState: EquipsState = {
      '1': createEquip(1, 1),
      '2': createEquip(2, 5),
      '3': createEquip(3, 10),
    }
    const postBody = {
      api_slotitem_ids: '1,3',
    }
    const result = reducer(initialState, {
      type: '@@Response/kcsapi/api_req_kousyou/destroyitem2',
      postBody,
    })
    expect(result).toEqual({
      '2': createEquip(2, 5),
    })
  })

  it('should handle api_req_kaisou/lock', () => {
    const initialState: EquipsState = {
      '1': createEquip(1, 1),
    }
    const postBody = {
      api_slotitem_id: '1',
    }
    const body = {
      api_locked: 1,
    }
    const result = reducer(initialState, {
      type: '@@Response/kcsapi/api_req_kaisou/lock',
      body,
      postBody,
    })
    expect(result['1'].api_locked).toBe(1)
  })
})
