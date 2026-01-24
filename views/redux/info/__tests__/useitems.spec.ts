import {
  createAPIGetMemberRequireInfoAction,
  createAPIGetMemberUseitemResponseAction,
  createAPIReqKousyouRemodelSlotlistDetailResponseAction,
  createAPIReqMissionResultResponseAction,
  createAPIReqSortieBattleResultResponseAction,
  createAPIReqCombinedBattleBattleresultResponseAction,
} from 'views/redux/actions'

import { reducer, UseItemsState } from '../useitems'

import type {
  APIReqKousyouRemodelSlotlistDetailResponseCompat,
  GameResponsePayload,
} from 'views/redux/actions'
import type {
  APIGetMemberRequireInfoRequest,
  APIGetMemberRequireInfoResponse,
  APIGetMemberUseitemRequest,
  APIGetMemberUseitemResponse,
  APIReqCombinedBattleBattleresultResponse,
  APIReqKousyouRemodelSlotlistDetailRequest,
  APIReqMissionResultRequest,
  APIReqMissionResultResponse,
  APIReqSortieBattleresultResponse,
} from 'kcsapi'

import apiReqMissionResultSuccessFixture from './__fixtures__/api_req_mission_result_success.json'
import apiReqSortieBattleresultFixture from './__fixtures__/api_req_sortie_battleresult_includes_member_exp.json'

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

    const payload: GameResponsePayload<
      APIGetMemberRequireInfoResponse,
      APIGetMemberRequireInfoRequest
    > = {
      method: 'POST',
      path: '/kcsapi/api_get_member/require_info',
      body: {
        api_basic: { api_firstflag: 0, api_member_id: 1 },
        api_extra_supply: [],
        api_furniture: [],
        api_kdock: [],
        api_oss_setting: { api_language_type: 0, api_oss_items: [] },
        api_skin_id: 0,
        api_slot_item: [],
        api_unsetslot: {},
        api_useitem: body.api_useitem,
      },
      postBody: { api_verno: '1' },
      time: 0,
    }
    const result = reducer({}, createAPIGetMemberRequireInfoAction(payload))
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

    const payload: GameResponsePayload<APIGetMemberUseitemResponse[], APIGetMemberUseitemRequest> =
      {
        method: 'POST',
        path: '/kcsapi/api_get_member/useitem',
        body,
        postBody: { api_verno: '1' },
        time: 0,
      }
    const result = reducer({}, createAPIGetMemberUseitemResponseAction(payload))
    expect(result).toEqual({
      '1': { api_id: 1, api_count: 15 },
      '3': { api_id: 3, api_count: 5 },
    })
  })

  it('should handle api_req_kousyou/remodel_slotlist_detail - consumes useitems', () => {
    const initialState: UseItemsState = {
      '1': { api_id: 1, api_count: 10 },
      '2': { api_id: 2, api_count: 5 },
    }

    const payload: GameResponsePayload<
      APIReqKousyouRemodelSlotlistDetailResponseCompat,
      APIReqKousyouRemodelSlotlistDetailRequest
    > = {
      method: 'POST',
      path: '/kcsapi/api_req_kousyou/remodel_slotlist_detail',
      body: {
        api_certain_buildkit: 0,
        api_certain_remodelkit: 0,
        api_change_flag: 0,
        api_req_buildkit: 0,
        api_req_remodelkit: 0,
        api_req_slot_id: 0,
        api_req_slot_num: 0,
        api_req_useitem_id: 1,
        api_req_useitem_num: 3,
        api_req_useitem_id2: 99,
        api_req_useitem_num2: 1,
      },
      postBody: { api_verno: '1', api_id: '1', api_slot_id: '1' },
      time: 0,
    }

    const result = reducer(
      initialState,
      createAPIReqKousyouRemodelSlotlistDetailResponseAction(payload),
    )

    expect(result['1'].api_count).toBe(7)
    expect(result['2'].api_count).toBe(5)
    expect(result['99'].api_count).toBe(-1)
  })

  it('should handle api_req_kousyou/remodel_slotlist_detail - creates missing items when consumed', () => {
    const initialState: UseItemsState = {}

    const payload: GameResponsePayload<
      APIReqKousyouRemodelSlotlistDetailResponseCompat,
      APIReqKousyouRemodelSlotlistDetailRequest
    > = {
      method: 'POST',
      path: '/kcsapi/api_req_kousyou/remodel_slotlist_detail',
      body: {
        api_certain_buildkit: 0,
        api_certain_remodelkit: 0,
        api_change_flag: 0,
        api_req_buildkit: 0,
        api_req_remodelkit: 0,
        api_req_slot_id: 0,
        api_req_slot_num: 0,
        api_req_useitem_id: 1,
        api_req_useitem_num: 3,
      },
      postBody: { api_verno: '1', api_id: '1', api_slot_id: '1' },
      time: 0,
    }

    const result = reducer(
      initialState,
      createAPIReqKousyouRemodelSlotlistDetailResponseAction(payload),
    )

    expect(result['1'].api_count).toBe(-3)
  })

  it('should handle api_req_mission/result - award increments', () => {
    const initialState: UseItemsState = {
      '4': { api_id: 4, api_count: 0 },
    }

    const payload: GameResponsePayload<APIReqMissionResultResponse, APIReqMissionResultRequest> = {
      ...apiReqMissionResultSuccessFixture,
      body: {
        ...apiReqMissionResultSuccessFixture.body,
        api_get_item1: {
          api_useitem_id: 4,
          api_useitem_count: 10,
          api_useitem_name: 'x',
        },
      },
    }

    const result = reducer(initialState, createAPIReqMissionResultResponseAction(payload))

    expect(result['4'].api_count).toBe(10)
  })

  it('should handle api_req_sortie/battleresult - award increments', () => {
    const initialState: UseItemsState = {
      '7': { api_id: 7, api_count: 1 },
    }

    const payload: GameResponsePayload<APIReqSortieBattleresultResponse, undefined> = {
      ...apiReqSortieBattleresultFixture,
      body: {
        ...apiReqSortieBattleresultFixture.body,
        api_get_useitem: { api_useitem_id: 7, api_useitem_name: 'x' },
        api_get_exmap_useitem_id: 8,
      },
      postBody: undefined,
      time: 0,
    }

    const result = reducer(initialState, createAPIReqSortieBattleResultResponseAction(payload))

    expect(result['7'].api_count).toBe(2)
    expect(result['8'].api_count).toBe(1)
  })

  it('should handle api_req_combined_battle/battleresult - award increments', () => {
    const initialState: UseItemsState = {}

    const payload: GameResponsePayload<APIReqCombinedBattleBattleresultResponse, undefined> = {
      method: 'POST',
      path: '/kcsapi/api_req_combined_battle/battleresult',
      body: (() => {
        const body: APIReqCombinedBattleBattleresultResponse & {
          api_get_useitem?: { api_useitem_id?: number }
        } = {
          api_dests: 0,
          api_destsf: 0,
          api_enemy_info: { api_level: '', api_rank: '', api_deck_name: 'x' },
          api_escape: null,
          api_escape_flag: 0,
          api_first_clear: 0,
          api_get_base_exp: 0,
          api_get_exmap_rate: 0,
          api_get_exmap_useitem_id: 8,
          api_get_exp: 0,
          api_get_exp_lvup: [],
          api_get_exp_lvup_combined: null,
          api_get_flag: [0, 0, 0],
          api_get_ship_exp: [],
          api_get_ship_exp_combined: null,
          api_member_exp: 0,
          api_member_lv: 0,
          api_mvp: 0,
          api_mvp_combined: null,
          api_quest_level: 0,
          api_quest_name: 'x',
          api_ship_id: [],
          api_win_rank: 'S',
          api_get_useitem: { api_useitem_id: 7 },
        }
        return body
      })(),
      postBody: undefined,
      time: 0,
    }

    const result = reducer(
      initialState,
      createAPIReqCombinedBattleBattleresultResponseAction(payload),
    )

    expect(result['7'].api_count).toBe(1)
    expect(result['8'].api_count).toBe(1)
  })
})
