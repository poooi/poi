import { reducer, ShipsState, Ship } from '../ships'
import {
  createAPIPortPortResponseAction,
  createAPIGetMemberShipDeckResponseAction,
  createAPIGetMemberShip3ResponseAction,
  createAPIGetMemberShip2ResponseAction,
  createAPIReqHenseiLockResponseAction,
  createAPIReqHokyuChargeResponseAction,
  createAPIReqKaisouPowerupResponseAction,
  createAPIReqKaisouSlotExchangeIndexResponseAction,
  createAPIReqKaisouMarriageResponseAction,
  createAPIReqKaisouSlotDepriveResponseAction,
  createAPIReqKousyouDestroyshipResponseAction,
  createAPIReqKousyouGetShipResponseAction,
  createAPIReqNyukyoStartResponseAction,
  createAPIGetMemberNdockResponseAction,
  createAPIReqMapAnchorageRepairResponseAction,
  createAPIReqKaisouOpenExslotResponseAction,
  createInfoShipsRepairCompletedAction,
} from '../../actions'

import type {
  APIGetMemberNdockRequest,
  APIGetMemberNdockResponse,
  APIGetMemberShip2Request,
  APIGetMemberShip2Response,
  APIGetMemberShip3Request,
  APIGetMemberShip3Response,
  APIGetMemberShipDeckRequest,
  APIGetMemberShipDeckResponse,
  APIPortPortRequest,
  APIPortPortResponse,
  APIReqHenseiLockRequest,
  APIReqHenseiLockResponse,
  APIReqHokyuChargeRequest,
  APIReqHokyuChargeResponse,
  APIReqKaisouMarriageRequest,
  APIReqKaisouMarriageResponse,
  APIReqKaisouOpenExslotRequest,
  APIReqKaisouOpenExslotResponse,
  APIReqKaisouPowerupRequest,
  APIReqKaisouPowerupResponse,
  APIReqKaisouSlotDepriveRequest,
  APIReqKaisouSlotDepriveResponse,
  APIReqKaisouSlotExchangeIndexRequest,
  APIReqKaisouSlotExchangeIndexResponse,
  APIReqKousyouDestroyshipRequest,
  APIReqKousyouDestroyshipResponse,
  APIReqKousyouGetshipRequest,
  APIReqKousyouGetshipResponse,
  APIReqMapAnchorageRepairRequest,
  APIReqNyukyoStartRequest,
  APIReqNyukyoStartResponse,
} from 'kcsapi'

import type { APIReqMapAnchorageRepairResponseCompat, GameResponsePayload } from '../../actions'

import lockFixture from './__fixtures__/api_req_hensei_lock.json'
import getShipFixture from './__fixtures__/api_req_kousyou_getship.json'
import portFixture from './__fixtures__/api_port_port.json'

import hokyuChargeFixture from './__fixtures__/api_req_hokyu_charge.json'
import shipDeckFixture from './__fixtures__/api_get_member_ship_deck.json'
import ship3Fixture from './__fixtures__/api_get_member_ship3.json'
import ship2Fixture from './__fixtures__/api_get_member_ship2.json'
import slotExchangeIndexFixture from './__fixtures__/api_req_kaisou_slot_exchange_index.json'
import marriageFixture from './__fixtures__/api_req_kaisou_marriage.json'
import slotDepriveFixture from './__fixtures__/api_req_kaisou_slot_deprive.json'
import powerupFixture from './__fixtures__/api_req_kaisou_powerup.json'
import nyukyoStartHighspeedFixture from './__fixtures__/api_req_nyukyo_start_bucket_repairs_immediately.json'
import nyukyoStartInstantCompletionFixture from './__fixtures__/api_req_nyukyo_start_instant_completion.json'
import ndockInstantCompletionFixture from './__fixtures__/api_get_member_ndock_instant_completion.json'
import anchorageRepairFixture from './__fixtures__/api_req_map_anchorage_repair.json'
import openExslotFixture from './__fixtures__/api_req_kaisou_open_exslot.json'

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
    const portPayload: GameResponsePayload<APIPortPortResponse, APIPortPortRequest> = portFixture

    const result = reducer({}, createAPIPortPortResponseAction(portPayload))

    // Sanity checks against real response-saver fixture
    expect(Object.keys(result).length).toBe(portPayload.body.api_ship.length)
    expect(result['1'].api_ship_id).toBe(246)
    expect(result['1'].api_cond).toBe(49)
    expect(result['1356'].api_ship_id).toBe(487)
  })

  it('should handle api_req_hensei/lock', () => {
    const initialState: ShipsState = {
      '26567': {
        ...createShip(26567, 100),
        api_locked: 1,
      },
    }

    const lockPayload: GameResponsePayload<APIReqHenseiLockResponse, APIReqHenseiLockRequest> =
      lockFixture

    const result = reducer(initialState, createAPIReqHenseiLockResponseAction(lockPayload))
    expect(result['26567'].api_locked).toBe(0)
  })

  it('should handle api_req_kousyou/destroyship', () => {
    const initialState: ShipsState = {
      '1': createShip(1, 100),
      '2': createShip(2, 200),
      '3': createShip(3, 300),
    }

    const destroyShipPayload: GameResponsePayload<
      APIReqKousyouDestroyshipResponse,
      APIReqKousyouDestroyshipRequest
    > = {
      method: 'POST',
      path: '/kcsapi/api_req_kousyou/destroyship',
      body: {
        api_material: [0, 0, 0, 0, 0, 0, 0, 0],
        api_unset_list: {},
      },
      postBody: {
        api_verno: '1',
        api_ship_id: '1,3',
        api_slot_dest_flag: '0',
      },
      time: 0,
    }

    const result = reducer(
      initialState,
      createAPIReqKousyouDestroyshipResponseAction(destroyShipPayload),
    )
    expect(result).toEqual({
      '2': createShip(2, 200),
    })
  })

  it('should handle api_req_kousyou/getship', () => {
    const initialState: ShipsState = {}

    const getShipPayload: GameResponsePayload<
      APIReqKousyouGetshipResponse,
      APIReqKousyouGetshipRequest
    > = getShipFixture

    const result = reducer(initialState, createAPIReqKousyouGetShipResponseAction(getShipPayload))
    expect(result['31985'].api_ship_id).toBe(41)
    expect(result['31985'].api_cond).toBe(40)
  })

  it('should handle api_get_member/ship_deck', () => {
    const shipDeckPayload: GameResponsePayload<
      APIGetMemberShipDeckResponse,
      APIGetMemberShipDeckRequest
    > = shipDeckFixture

    const initialState: ShipsState = {
      // ensure compareUpdate actually changes something
      '1777': {
        api_id: 1777,
        api_ship_id: 127,
        api_cond: 0,
      },
    }
    const result = reducer(initialState, createAPIGetMemberShipDeckResponseAction(shipDeckPayload))
    expect(result['1777'].api_cond).toBe(39)
    expect(result['30478'].api_ship_id).toBe(636)
  })

  it('should handle api_get_member/ship3', () => {
    const ship3Payload: GameResponsePayload<APIGetMemberShip3Response, APIGetMemberShip3Request> =
      ship3Fixture

    const result = reducer({}, createAPIGetMemberShip3ResponseAction(ship3Payload))
    expect(result['29459'].api_ship_id).toBe(85)
    expect(result['29459'].api_cond).toBe(46)
  })

  it('should handle api_get_member/ship2', () => {
    const ship2Payload: GameResponsePayload<
      Array<Partial<APIGetMemberShip2Response> & { api_id: number }>,
      APIGetMemberShip2Request
    > = ship2Fixture

    const result = reducer({}, createAPIGetMemberShip2ResponseAction(ship2Payload))
    expect(result['1'].api_ship_id).toBe(246)
    expect(result['1'].api_cond).toBe(49)
  })

  it('should handle api_req_hokyu/charge', () => {
    const hokyuChargePayload: GameResponsePayload<
      APIReqHokyuChargeResponse,
      APIReqHokyuChargeRequest
    > = hokyuChargeFixture

    const initialState: ShipsState = {
      '84': {
        api_id: 84,
        api_ship_id: 999,
        api_fuel: 0,
        api_bull: 0,
        api_onslot: [0, 0, 0, 0, 0],
        api_nowhp: 10,
        api_maxhp: 10,
      },
    }

    const result = reducer(initialState, createAPIReqHokyuChargeResponseAction(hokyuChargePayload))
    expect(result['84'].api_fuel).toBe(25)
    expect(result['84'].api_bull).toBe(30)
    expect(result['84'].api_onslot).toEqual([1, 1, 1, 0, 0])
    // unrelated fields should remain
    expect(result['84'].api_nowhp).toBe(10)
  })

  it('should handle api_req_kaisou/slot_exchange_index', () => {
    const slotExchangePayload: GameResponsePayload<
      APIReqKaisouSlotExchangeIndexResponse,
      APIReqKaisouSlotExchangeIndexRequest
    > = slotExchangeIndexFixture

    const result = reducer(
      {},
      createAPIReqKaisouSlotExchangeIndexResponseAction(slotExchangePayload),
    )
    expect(result['30551'].api_ship_id).toBe(116)
    expect(result['30551'].api_slot?.[0]).toBe(51076)
  })

  it('should return current state for api_req_kaisou/slot_exchange_index with missing api_ship_data', () => {
    const initialState: ShipsState = { '1': createShip(1, 100) }
    const badPayload: GameResponsePayload<
      APIReqKaisouSlotExchangeIndexResponse,
      APIReqKaisouSlotExchangeIndexRequest
    > = {
      method: 'POST',
      path: '/kcsapi/api_req_kaisou/slot_exchange_index',
      body: {} as APIReqKaisouSlotExchangeIndexResponse,
      postBody: {
        api_verno: '1',
        api_id: '1',
        api_src_idx: '0',
        api_dst_idx: '1',
      },
      time: 0,
    }
    const result = reducer(
      initialState,
      createAPIReqKaisouSlotExchangeIndexResponseAction(badPayload),
    )
    expect(result).toBe(initialState)
  })

  it('should handle api_req_kaisou/marriage', () => {
    const marriagePayload: GameResponsePayload<
      APIReqKaisouMarriageResponse,
      APIReqKaisouMarriageRequest
    > = marriageFixture

    const result = reducer({}, createAPIReqKaisouMarriageResponseAction(marriagePayload))
    expect(result['203'].api_ship_id).toBe(319)
    expect(result['203'].api_lv).toBe(100)
  })

  it('should return current state for api_req_kaisou/marriage with invalid body', () => {
    const initialState: ShipsState = { '1': createShip(1, 100) }
    const badPayload: GameResponsePayload<
      APIReqKaisouMarriageResponse,
      APIReqKaisouMarriageRequest
    > = {
      method: 'POST',
      path: '/kcsapi/api_req_kaisou/marriage',
      // @ts-expect-error api_id should be number; test invalid payload guard
      body: { api_id: 'nope' },
      postBody: { api_verno: '1', api_id: '1' },
      time: 0,
    }
    const result = reducer(initialState, createAPIReqKaisouMarriageResponseAction(badPayload))
    expect(result).toBe(initialState)
  })

  it('should handle api_req_kaisou/slot_deprive', () => {
    const slotDeprivePayload: GameResponsePayload<
      APIReqKaisouSlotDepriveResponse,
      APIReqKaisouSlotDepriveRequest
    > = slotDepriveFixture

    const result = reducer({}, createAPIReqKaisouSlotDepriveResponseAction(slotDeprivePayload))
    expect(result['30864'].api_ship_id).toBe(535)
    expect(result['30887'].api_ship_id).toBe(47)
  })

  it('should return current state for api_req_kaisou/slot_deprive with invalid body', () => {
    const initialState: ShipsState = { '1': createShip(1, 100) }
    const badPayload: GameResponsePayload<
      APIReqKaisouSlotDepriveResponse,
      APIReqKaisouSlotDepriveRequest
    > = {
      method: 'POST',
      path: '/kcsapi/api_req_kaisou/slot_deprive',
      body: {} as APIReqKaisouSlotDepriveResponse,
      postBody: {
        api_verno: '1',
        api_unset_idx: '0',
        api_set_slot_kind: '0',
        api_unset_slot_kind: '0',
        api_unset_ship: '1',
        api_set_idx: '0',
        api_set_ship: '2',
      },
      time: 0,
    }
    const result = reducer(initialState, createAPIReqKaisouSlotDepriveResponseAction(badPayload))
    expect(result).toBe(initialState)
  })

  it('should handle api_req_kaisou/powerup', () => {
    const powerupPayload: GameResponsePayload<
      APIReqKaisouPowerupResponse,
      APIReqKaisouPowerupRequest
    > = powerupFixture

    const initialState: ShipsState = {
      // materials ships to delete
      '28343': createShip(28343, 1),
      '28338': createShip(28338, 1),
      // keep unrelated
      '999': createShip(999, 1),
    }

    const result = reducer(initialState, createAPIReqKaisouPowerupResponseAction(powerupPayload))
    expect(result['28341'].api_ship_id).toBe(483)
    expect(result['28343']).toBeUndefined()
    expect(result['28338']).toBeUndefined()
    expect(result['999'].api_ship_id).toBe(1)
  })

  it('should return current state for api_req_kaisou/powerup when api_id_items is missing', () => {
    const initialState: ShipsState = { '1': createShip(1, 100) }
    const badPayload: GameResponsePayload<APIReqKaisouPowerupResponse, APIReqKaisouPowerupRequest> =
      {
        ...(powerupFixture as GameResponsePayload<
          APIReqKaisouPowerupResponse,
          APIReqKaisouPowerupRequest
        >),
        // @ts-expect-error api_id_items is missing; test invalid payload guard
        postBody: {
          api_verno: '1',
          api_id: '28341',
        },
      }
    const result = reducer(initialState, createAPIReqKaisouPowerupResponseAction(badPayload))
    expect(result).toBe(initialState)
  })

  it('should handle api_req_nyukyo/start with api_highspeed=1', () => {
    const startPayload: GameResponsePayload<APIReqNyukyoStartResponse, APIReqNyukyoStartRequest> =
      nyukyoStartHighspeedFixture

    const initialState: ShipsState = {
      '9': {
        ...createShip(9, 999),
        api_nowhp: 1,
        api_maxhp: 30,
        api_cond: 10,
        api_ndock_time: 123,
      },
    }
    const result = reducer(initialState, createAPIReqNyukyoStartResponseAction(startPayload))
    expect(result['9'].api_nowhp).toBe(30)
    expect(result['9'].api_cond).toBe(40)
    expect(result['9'].api_ndock_time).toBe(0)
  })

  it('should handle instant docking completion (api_req_nyukyo/start -> api_get_member/ndock)', () => {
    const startPayload: GameResponsePayload<APIReqNyukyoStartResponse, APIReqNyukyoStartRequest> =
      nyukyoStartInstantCompletionFixture
    const ndockPayload: GameResponsePayload<APIGetMemberNdockResponse[], APIGetMemberNdockRequest> =
      ndockInstantCompletionFixture

    const damagedShip: Ship = {
      ...createShip(30472, 1),
      api_nowhp: 1,
      api_maxhp: 30,
      api_cond: 0,
      api_ndock_time: 999,
    }
    const initialState: ShipsState = {
      '30472': damagedShip,
    }

    const afterStart = reducer(initialState, createAPIReqNyukyoStartResponseAction(startPayload))
    expect(afterStart).toBe(initialState)

    const afterNdock = reducer(afterStart, createAPIGetMemberNdockResponseAction(ndockPayload))
    expect(afterNdock['30472'].api_nowhp).toBe(30)
    expect(afterNdock['30472'].api_cond).toBe(40)
    expect(afterNdock['30472'].api_ndock_time).toBe(0)

    // should not apply again (instant state should have been cleared)
    const afterNdockAgain = reducer(afterNdock, createAPIGetMemberNdockResponseAction(ndockPayload))
    expect(afterNdockAgain).toBe(afterNdock)
  })

  it('should return current state for api_req_nyukyo/start when api_ship_id is missing', () => {
    const initialState: ShipsState = { '1': createShip(1, 100) }
    const badPayload: GameResponsePayload<APIReqNyukyoStartResponse, APIReqNyukyoStartRequest> = {
      method: 'POST',
      path: '/kcsapi/api_req_nyukyo/start',
      body: { api_result: 1, api_result_msg: '成功' },
      // @ts-expect-error api_ship_id is missing; test invalid payload guard
      postBody: {
        api_verno: '1',
        api_highspeed: '0',
        api_ndock_id: '1',
      },
      time: 0,
    }
    const result = reducer(initialState, createAPIReqNyukyoStartResponseAction(badPayload))
    expect(result).toBe(initialState)
  })

  it('should handle api_req_map/anchorage_repair', () => {
    const payload: GameResponsePayload<
      APIReqMapAnchorageRepairResponseCompat,
      APIReqMapAnchorageRepairRequest
    > = anchorageRepairFixture

    const initialState: ShipsState = {
      '166': {
        api_id: 166,
        api_ship_id: 118,
        api_nowhp: 1,
      },
    }

    const result = reducer(initialState, createAPIReqMapAnchorageRepairResponseAction(payload))
    expect(result['166'].api_nowhp).toBe(30)
  })

  it('should return current state for api_req_map/anchorage_repair when body is invalid', () => {
    const initialState: ShipsState = { '1': createShip(1, 100) }
    const badPayload: GameResponsePayload<
      APIReqMapAnchorageRepairResponseCompat,
      APIReqMapAnchorageRepairRequest
    > = {
      method: 'POST',
      path: '/kcsapi/api_req_map/anchorage_repair',
      body: {} as APIReqMapAnchorageRepairResponseCompat,
      postBody: { api_verno: '1' },
      time: 0,
    }
    const result = reducer(initialState, createAPIReqMapAnchorageRepairResponseAction(badPayload))
    expect(result).toBe(initialState)
  })

  it('should handle api_req_kaisou/open_exslot', () => {
    const payload: GameResponsePayload<
      APIReqKaisouOpenExslotResponse,
      APIReqKaisouOpenExslotRequest
    > = openExslotFixture
    const initialState: ShipsState = {
      '17': {
        ...createShip(17, 1),
        api_slot_ex: 0,
      },
    }
    const result = reducer(initialState, createAPIReqKaisouOpenExslotResponseAction(payload))
    expect(result['17'].api_slot_ex).toBe(-1)
  })

  it('should return current state for api_req_kaisou/open_exslot when api_id is missing', () => {
    const initialState: ShipsState = { '1': createShip(1, 100) }
    const badPayload: GameResponsePayload<
      APIReqKaisouOpenExslotResponse,
      APIReqKaisouOpenExslotRequest
    > = {
      method: 'POST',
      path: '/kcsapi/api_req_kaisou/open_exslot',
      body: { api_result: 1, api_result_msg: '成功' },
      // @ts-expect-error api_id is missing; test invalid payload guard
      postBody: { api_verno: '1' },
      time: 0,
    }
    const result = reducer(initialState, createAPIReqKaisouOpenExslotResponseAction(badPayload))
    expect(result).toBe(initialState)
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
    const result = reducer(initialState, createInfoShipsRepairCompletedAction({ api_ship_id: 1 }))
    expect(result['1'].api_nowhp).toBe(damagedShip.api_maxhp)
    expect(result['1'].api_cond).toBe(40) // Max of 40 and original cond
    expect(result['1'].api_ndock_time).toBe(0)
  })
})
