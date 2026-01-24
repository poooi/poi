import {
  createAPIPortPortResponseAction,
  createAPIGetMemberMaterialResponseAction,
  createAPIReqNyukyoSpeedchangeResponseAction,
  createAPIReqHokyuChargeResponseAction,
  createAPIReqKousyouDestroyshipResponseAction,
  createAPIReqKousyouCreateitemResponseAction,
  createAPIReqKousyouRemodelSlotResponseAction,
  createAPIReqKousyouCreateshipResponseAction,
  createAPIReqAirCorpsSetPlaneResponseAction,
  createAPIReqAirCorpsSupplyResponseAction,
  createInfoResourcesApplyDeltaAction,
} from 'views/redux/actions'
import apiPortPortFixture from './__fixtures__/api_port_port_typical.json'
import speedchangeFixture from './__fixtures__/api_req_nyukyo_speedchange_use_bucket.json'
import chargeFixture from './__fixtures__/api_req_hokyu_charge_refuel_rearm.json'
import setPlaneFixture from './__fixtures__/api_req_air_corps_set_plane_assign_planes.json'
import supplyFixture from './__fixtures__/api_req_air_corps_supply_resupply_squadron.json'
import materialFixture from './__fixtures__/api_get_member_material_typical.json'
import createItemFixture from './__fixtures__/api_req_kousyou_createitem_success.json'
import remodelSlotFixture from './__fixtures__/api_req_kousyou_remodel_slot_success_consumes_slots.json'
import createshipFixture from './__fixtures__/api_req_kousyou_createship_latest_response_saver.json'

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
    const result = reducer([], createAPIPortPortResponseAction(apiPortPortFixture))
    expect(result).toMatchSnapshot()
  })

  it('should handle api_get_member/material', () => {
    const result = reducer([], createAPIGetMemberMaterialResponseAction(materialFixture))
    expect(result.length).toBe(8)
    expect(result[0]).toBe(169106)
    expect(result[7]).toBe(34)
  })

  it('should handle api_req_nyukyo/speedchange', () => {
    const currentState: ResourcesState = [1000, 1000, 1000, 1000, 100, 100, 100, 100]
    const result = reducer(
      currentState,
      createAPIReqNyukyoSpeedchangeResponseAction(speedchangeFixture),
    )
    expect(result[5]).toBe(99) // Bucket decremented by 1
  })

  it('should handle api_req_hokyu/charge', () => {
    const result = reducer(
      [1, 1, 1, 1, 1, 1, 1, 1],
      createAPIReqHokyuChargeResponseAction(chargeFixture),
    )
    expect(result).toEqual([61856, 190510, 214408, 126215, 1, 1, 1, 1])
  })

  it('should handle api_req_kousyou/destroyship - updates material (4-length)', () => {
    const result = reducer(
      [10, 10, 10, 10, 10, 10, 10, 10],
      createAPIReqKousyouDestroyshipResponseAction({
        method: 'POST',
        path: '/kcsapi/api_req_kousyou/destroyship',
        body: { api_material: [20, 21, 22, 23], api_unset_list: {} },
        postBody: { api_ship_id: '1', api_slot_dest_flag: '0', api_verno: '1' },
        time: 0,
      }),
    )
    expect(result).toEqual([20, 21, 22, 23, 10, 10, 10, 10])
  })

  it('should handle api_req_kousyou/createitem', () => {
    const result = reducer(
      [10, 10, 10, 10, 10, 10, 10, 10],
      createAPIReqKousyouCreateitemResponseAction(createItemFixture),
    )
    expect(result).toEqual(createItemFixture.body.api_material)
  })

  it('should handle api_req_kousyou/remodel_slot', () => {
    const result = reducer(
      [10, 10, 10, 10, 10, 10, 10, 10],
      createAPIReqKousyouRemodelSlotResponseAction(remodelSlotFixture),
    )
    expect(result).toEqual(remodelSlotFixture.body.api_after_material)
  })

  it('should handle api_req_kousyou/createship - spending + instant build', () => {
    const result = reducer(
      [100, 100, 100, 100, 10, 10, 10, 10],
      createAPIReqKousyouCreateshipResponseAction(createshipFixture),
    )

    const postBody = createshipFixture.postBody
    const expected = [100, 100, 100, 100, 10, 10, 10, 10]
    const lsc = parseInt(String(postBody.api_item1)) > 1000
    expected[4] -= parseInt(String(postBody.api_highspeed)) > 0 ? (lsc ? 10 : 1) : 0
    expected[0] -= parseInt(String(postBody.api_item1))
    expected[1] -= parseInt(String(postBody.api_item2))
    expected[2] -= parseInt(String(postBody.api_item3))
    expected[3] -= parseInt(String(postBody.api_item4))
    expected[6] -= parseInt(String(postBody.api_item5))
    expect(result).toEqual(expected)
  })

  it('should handle api_req_kousyou/createship - LSC instant build consumes 10', () => {
    const result = reducer(
      [2000, 2000, 2000, 2000, 20, 10, 10, 10],
      createAPIReqKousyouCreateshipResponseAction({
        method: 'POST',
        path: '/kcsapi/api_req_kousyou/createship',
        body: { api_result: 1, api_result_msg: 'ok' },
        postBody: {
          api_item1: '1500',
          api_item2: '10',
          api_item3: '10',
          api_item4: '10',
          api_item5: '0',
          api_highspeed: '1',
          api_kdock_id: '1',
          api_large_flag: '1',
          api_verno: '1',
        },
        time: 0,
      }),
    )
    expect(result[4]).toBe(10)
  })

  it('should handle api_req_air_corps/set_plane - updates bauxite', () => {
    const result = reducer(
      [1, 1, 1, 100, 1, 1, 1, 1],
      createAPIReqAirCorpsSetPlaneResponseAction(setPlaneFixture),
    )
    // Fixture doesn't include api_after_bauxite; reducer should no-op.
    expect(result[3]).toBe(100)
  })

  it('should handle api_req_air_corps/supply - updates fuel and bauxite', () => {
    const result = reducer(
      [100, 1, 1, 200, 1, 1, 1, 1],
      createAPIReqAirCorpsSupplyResponseAction(supplyFixture),
    )
    expect(result[0]).toBe(102760)
    expect(result[3]).toBe(71894)
  })

  it('should handle @@info.resources@ApplyDelta', () => {
    const result = reducer(
      [1, 2, 3, 4, 5, 6, 7, 8],
      createInfoResourcesApplyDeltaAction({ delta: [1, -1, 0, 0, 0, 0, 0, 0] }),
    )
    expect(result).toEqual([2, 1, 3, 4, 5, 6, 7, 8])
  })
})
