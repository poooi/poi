import {
  createAPIGetMemberSlotItemResponseAction,
  createAPIGetMemberRequireInfoAction,
  createAPIReqKousyouCreateitemResponseAction,
  createAPIReqKousyouGetShipResponseAction,
  createAPIReqKousyouDestroyitem2ResponseAction,
  createAPIReqKaisouLockResponseAction,
  createAPIReqKousyouRemodelSlotResponseAction,
  createAPIReqMemberItemuseResponseAction,
  createInfoEquipsRemoveByIdsAction,
} from 'views/redux/actions'

import type { EquipsState, Equip } from '../equips'

import { reducer } from '../equips'
import requireInfoLargeFixture from './__fixtures__/api_get_member_require_info_large_snapshot.json'
import slotItemFixture from './__fixtures__/api_get_member_slot_item_large_snapshot.json'
import lockFixture from './__fixtures__/api_req_kaisou_lock_latest_response_saver.json'
import createitemFailureFixture from './__fixtures__/api_req_kousyou_createitem_latest_response_saver.json'
import createitemFixture from './__fixtures__/api_req_kousyou_createitem_success.json'
import destroyitem2Fixture from './__fixtures__/api_req_kousyou_destroyitem2_multiple_slots.json'
import getShipFixture from './__fixtures__/api_req_kousyou_getship_receive_new_ship.json'
import remodelSlotFixture from './__fixtures__/api_req_kousyou_remodel_slot_success_consumes_slots.json'
import itemuseFixture from './__fixtures__/api_req_member_itemuse_latest_response_saver.json'

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
    const result = reducer({}, createAPIGetMemberSlotItemResponseAction(slotItemFixture))
    expect(Object.keys(result).length).toBeGreaterThan(0)
  })

  it('should handle api_get_member/require_info', () => {
    const result = reducer({}, createAPIGetMemberRequireInfoAction(requireInfoLargeFixture))
    expect(Object.keys(result).length).toBeGreaterThan(0)
  })

  it('should handle api_req_kousyou/destroyitem2', () => {
    const initialState: EquipsState = {
      '1': createEquip(1, 1),
      '2': createEquip(2, 5),
      '3': createEquip(3, 10),
    }
    const payload: Parameters<typeof createAPIReqKousyouDestroyitem2ResponseAction>[0] = {
      ...destroyitem2Fixture,
      postBody: { ...destroyitem2Fixture.postBody, api_slotitem_ids: '1,3' },
    }
    const result = reducer(initialState, createAPIReqKousyouDestroyitem2ResponseAction(payload))
    expect(result).toEqual({
      '2': createEquip(2, 5),
    })
  })

  it('should handle api_req_kousyou/createitem - no change on failure', () => {
    const initialState: EquipsState = {
      '1': createEquip(1, 1),
    }

    const result = reducer(
      initialState,
      createAPIReqKousyouCreateitemResponseAction(createitemFailureFixture),
    )
    expect(result).toBe(initialState)
  })

  it('should handle api_req_kousyou/createitem - merges valid api_get_items only', () => {
    const initialState: EquipsState = {
      '1': createEquip(1, 1),
    }

    const payload: Parameters<typeof createAPIReqKousyouCreateitemResponseAction>[0] = {
      ...createitemFixture,
      body: {
        ...createitemFixture.body,
        api_get_items: [
          { api_id: 2, api_slotitem_id: 10 },
          { api_id: 0, api_slotitem_id: 999 },
        ],
      },
    }
    const result = reducer(initialState, createAPIReqKousyouCreateitemResponseAction(payload))

    expect(result).toEqual({
      '1': createEquip(1, 1),
      '2': { api_id: 2, api_slotitem_id: 10 },
    })
  })

  it('should handle api_req_kousyou/getship - adds api_slotitem', () => {
    const initialState: EquipsState = {}
    const result = reducer(initialState, createAPIReqKousyouGetShipResponseAction(getShipFixture))
    expect(result['52721']).toEqual({ api_id: 52721, api_slotitem_id: 2 })
  })

  it('should handle api_req_kousyou/remodel_slot - removes and adds', () => {
    const initialState: EquipsState = {
      '1': createEquip(1, 1),
      '2': createEquip(2, 2),
    }

    const payload: Parameters<typeof createAPIReqKousyouRemodelSlotResponseAction>[0] = {
      ...remodelSlotFixture,
      body: {
        ...remodelSlotFixture.body,
        api_use_slot_id: [1],
        api_remodel_flag: 1,
        api_after_slot: {
          api_id: 3,
          api_slotitem_id: 30,
          api_level: 0,
          api_locked: 0,
        },
      },
    }
    const result = reducer(initialState, createAPIReqKousyouRemodelSlotResponseAction(payload))

    expect(result).toEqual({
      '2': createEquip(2, 2),
      '3': { api_id: 3, api_slotitem_id: 30, api_locked: 0, api_level: 0 },
    })
  })

  it('should handle api_req_member/itemuse - adds equips', () => {
    const initialState: EquipsState = {}
    const payload: Parameters<typeof createAPIReqMemberItemuseResponseAction>[0] = {
      ...itemuseFixture,
      body: {
        ...itemuseFixture.body,
        api_getitem: [
          {
            api_getcount: 1,
            api_mst_id: 0,
            api_usemst: 0,
            api_slotitem: {
              api_id: 10,
              api_slotitem_id: 100,
              api_level: 0,
              api_locked: 0,
            },
          },
        ],
      },
    }
    const result = reducer(initialState, createAPIReqMemberItemuseResponseAction(payload))
    expect(result['10']).toEqual({ api_id: 10, api_slotitem_id: 100, api_locked: 0, api_level: 0 })
  })

  it('should handle @@info.equips@RemoveByIds', () => {
    const initialState: EquipsState = {
      '1': createEquip(1, 1),
      '2': createEquip(2, 2),
    }
    const result = reducer(initialState, createInfoEquipsRemoveByIdsAction({ ids: ['2'] }))
    expect(result).toEqual({
      '1': createEquip(1, 1),
    })
  })

  it('should handle @@info.equips@RemoveByIds - no change for unknown ids', () => {
    const initialState: EquipsState = {
      '1': createEquip(1, 1),
    }
    const result = reducer(initialState, createInfoEquipsRemoveByIdsAction({ ids: ['999'] }))
    expect(result).toEqual(initialState)
  })

  it('should handle api_req_kaisou/lock', () => {
    const initialState: EquipsState = {
      '1': createEquip(1, 1),
    }
    const payload: Parameters<typeof createAPIReqKaisouLockResponseAction>[0] = {
      ...lockFixture,
      postBody: { ...lockFixture.postBody, api_slotitem_id: '1' },
      body: { api_locked: 1 },
    }
    const result = reducer(initialState, createAPIReqKaisouLockResponseAction(payload))
    expect(result['1'].api_locked).toBe(1)
  })
})
