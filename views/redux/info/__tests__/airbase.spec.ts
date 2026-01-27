import type {
  APIReqMapNextRequest,
  APIReqMapNextResponse,
  APIGetMemberMapinfoResponse,
  APIGetMemberMapinfoRequest,
  APIPortPortRequest,
  APIPortPortResponse,
} from 'kcsapi'

import type {
  APIReqAirCorpsChangeDeploymentBaseRequest,
  APIReqAirCorpsChangeDeploymentBaseResponse,
  GameResponsePayload,
} from '../../actions'

import {
  createAPIGetMemberMapinfoResponseAction,
  createAPIReqAirCorpsSetPlaneResponseAction,
  createAPIReqAirCorpsChangeNameResponseAction,
  createAPIReqAirCorpsSetActionResponseAction,
  createAPIReqAirCorpsSupplyResponseAction,
  createAPIReqAirCorpsChangeDeploymentBaseResponseAction,
  createAPIReqMapNextResponseAction,
  createAPIPortPortResponseAction,
} from '../../actions'
import { reducer, type AirBase } from '../airbase'
import mapInfoFixture from './__fixtures__/api_get_member_mapinfo_typical.json'
import apiPortPortFixture from './__fixtures__/api_port_port_typical.json'
import changeNameFixture from './__fixtures__/api_req_air_corps_change_name_rename_base.json'
import setActionFixture from './__fixtures__/api_req_air_corps_set_action_bulk_update.json'
import setPlaneFixture from './__fixtures__/api_req_air_corps_set_plane_assign_planes.json'
import supplyFixture from './__fixtures__/api_req_air_corps_supply_resupply_squadron.json'
import nextDestructionBattleFixture from './__fixtures__/api_req_map_next_destruction_battle_applies_base_damage.json'
import nextFixture from './__fixtures__/api_req_map_next_with_itemget.json'

describe('airbase reduer', () => {
  const initialState = reducer([], createAPIGetMemberMapinfoResponseAction(mapInfoFixture))

  it('empty action', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual([])
  })

  it('createAPIGetMemberMapinfoResponseAction', () => {
    const emptyPayload: GameResponsePayload<
      APIGetMemberMapinfoResponse,
      APIGetMemberMapinfoRequest
    > = {
      method: 'POST',
      path: '/kcsapi/api_get_member/mapinfo',
      body: { api_air_base: [], api_map_info: [] },
      postBody: { api_verno: '1' },
      time: 0,
    }
    expect(reducer([], createAPIGetMemberMapinfoResponseAction(emptyPayload))).toEqual([])

    expect(reducer([], createAPIGetMemberMapinfoResponseAction(mapInfoFixture))).toMatchSnapshot()
  })

  it('createAPIReqAirCorpsSetPlaneResponseAction', () => {
    expect(initialState).toMatchDiffSnapshot(
      reducer(initialState, createAPIReqAirCorpsSetPlaneResponseAction(setPlaneFixture)),
    )
  })

  it('createAPIReqAirCorpsChangeNameResponseAction', () => {
    expect(initialState).toMatchDiffSnapshot(
      reducer(initialState, createAPIReqAirCorpsChangeNameResponseAction(changeNameFixture)),
    )
  })

  it('createAPIReqAirCorpsSetActionResponseAction', () => {
    expect(initialState).toMatchDiffSnapshot(
      reducer(initialState, createAPIReqAirCorpsSetActionResponseAction(setActionFixture)),
    )
  })

  it('createAPIReqAirCorpsSupplyResponseAction', () => {
    expect(initialState).toMatchDiffSnapshot(
      reducer(initialState, createAPIReqAirCorpsSupplyResponseAction(supplyFixture)),
    )
  })

  it('createAPIPortPortResponseAction', () => {
    const portPayload: GameResponsePayload<APIPortPortResponse, APIPortPortRequest> = {
      method: 'POST',
      path: '/kcsapi/api_port/port',
      body: apiPortPortFixture.body,
      postBody: apiPortPortFixture.postBody,
      time: 0,
    }
    expect(initialState).toMatchDiffSnapshot(
      reducer(initialState, createAPIPortPortResponseAction(portPayload)),
    )
  })

  it('createAPIReqMapNextResponseAction', () => {
    const payload: GameResponsePayload<APIReqMapNextResponse, APIReqMapNextRequest> = nextFixture
    expect(initialState).toMatchDiffSnapshot(
      reducer(initialState, createAPIReqMapNextResponseAction(payload)),
    )
  })

  it('createAPIReqMapNextResponseAction - applies base hp damage', () => {
    // Fixture has api_maparea_id = 47 and two bases worth of hp arrays.
    const before: AirBase[] = [
      {
        api_area_id: 47,
        api_rid: 1,
        api_plane_info: [{ api_squadron_id: 1, api_slotid: 1, api_state: 0 }],
      },
      {
        api_area_id: 47,
        api_rid: 2,
        api_plane_info: [{ api_squadron_id: 1, api_slotid: 2, api_state: 0 }],
      },
    ]

    // NOTE: Uses a real response-saver payload.
    const payload: GameResponsePayload<APIReqMapNextResponse, APIReqMapNextRequest> =
      nextDestructionBattleFixture
    const after = reducer(before, createAPIReqMapNextResponseAction(payload))

    expect(after[0].api_maxhp).toBe(200)
    expect(after[0].api_nowhp).toBe(152) // 200 - 48

    expect(after[1].api_maxhp).toBe(200)
    expect(after[1].api_nowhp).toBe(176) // 200 - 24
  })

  it('createAPIPortPortResponseAction - clears hp fields', () => {
    const before: AirBase[] = [
      {
        api_area_id: 1,
        api_rid: 1,
        api_maxhp: 100,
        api_nowhp: 50,
      },
    ]

    const portPayload: GameResponsePayload<APIPortPortResponse, APIPortPortRequest> = {
      method: 'POST',
      path: '/kcsapi/api_port/port',
      body: apiPortPortFixture.body,
      postBody: apiPortPortFixture.postBody,
      time: 0,
    }

    const after = reducer(before, createAPIPortPortResponseAction(portPayload))

    expect(after[0].api_maxhp).toBeUndefined()
    expect(after[0].api_nowhp).toBeUndefined()
  })

  it('createAPIReqAirCorpsChangeDeploymentBaseResponseAction - swaps squadron data', () => {
    const before: AirBase[] = [
      {
        api_area_id: 1,
        api_rid: 1,
        api_distance: { api_base: 0, api_bonus: 0 },
        api_plane_info: [
          { api_squadron_id: 1, api_slotid: 111, api_state: 0 },
          { api_squadron_id: 2, api_slotid: 222, api_state: 0 },
        ],
      },
      {
        api_area_id: 1,
        api_rid: 2,
        api_distance: { api_base: 0, api_bonus: 0 },
        api_plane_info: [{ api_squadron_id: 1, api_slotid: 333, api_state: 0 }],
      },
    ]

    const payload: GameResponsePayload<
      APIReqAirCorpsChangeDeploymentBaseResponse,
      APIReqAirCorpsChangeDeploymentBaseRequest
    > = {
      method: 'POST',
      path: '/kcsapi/api_req_air_corps/change_deployment_base',
      postBody: {
        api_verno: '1',
        api_area_id: '1',
        api_base_id_src: '1',
        api_base_id: '2',
        api_item_id: '222',
        api_squadron_id: '2',
      },
      body: {
        api_base_items: [
          {
            api_rid: 1,
            api_distance: { api_base: 0, api_bonus: 0 },
            api_plane_info: [{ api_squadron_id: 1, api_slotid: 111, api_state: 0 }],
          },
          {
            api_rid: 2,
            api_distance: { api_base: 0, api_bonus: 0 },
            api_plane_info: [{ api_squadron_id: 1, api_slotid: 222, api_state: 0 }],
          },
        ],
      },
      time: 0,
    }

    const after = reducer(before, createAPIReqAirCorpsChangeDeploymentBaseResponseAction(payload))

    expect(after).toHaveLength(2)
    const [base0, base1] = after
    if (!base0 || !base1) {
      throw new Error('Expected 2 airbases after swap')
    }
    const plane0 = base0.api_plane_info?.[0]
    const plane1 = base1.api_plane_info?.[0]
    if (!plane0 || !plane1) {
      throw new Error('Expected plane_info to be non-empty after swap')
    }
    expect(plane0).toMatchObject({ api_squadron_id: 1, api_slotid: 111 })
    expect(plane1).toMatchObject({ api_squadron_id: 1, api_slotid: 222 })
  })

  it('createAPIReqAirCorpsChangeDeploymentBaseResponseAction - no change if invalid preconditions', () => {
    const before: AirBase[] = [
      {
        api_area_id: 1,
        api_rid: 1,
        api_plane_info: [{ api_squadron_id: 1, api_slotid: 111, api_state: 0 }],
      },
    ]

    const afterWrongLen = reducer(
      before,
      createAPIReqAirCorpsChangeDeploymentBaseResponseAction({
        method: 'POST',
        path: '/kcsapi/api_req_air_corps/change_deployment_base',
        postBody: {
          api_verno: '1',
          api_area_id: '1',
          api_base_id_src: '1',
          api_base_id: '1',
          api_item_id: '111',
          api_squadron_id: '1',
        },
        body: {
          api_base_items: [
            {
              api_rid: 1,
              api_distance: { api_base: 0, api_bonus: 0 },
              api_plane_info: [{ api_squadron_id: 1, api_slotid: 111, api_state: 0 }],
            },
          ],
        },
        time: 0,
      }),
    )

    expect(afterWrongLen).toBe(before)

    const afterNotFound = reducer(
      before,
      createAPIReqAirCorpsChangeDeploymentBaseResponseAction({
        method: 'POST',
        path: '/kcsapi/api_req_air_corps/change_deployment_base',
        postBody: {
          api_verno: '1',
          api_area_id: '1',
          api_base_id_src: '1',
          api_base_id: '1',
          api_item_id: '999',
          api_squadron_id: '1',
        },
        body: {
          api_base_items: [
            {
              api_rid: 1,
              api_distance: { api_base: 0, api_bonus: 0 },
              api_plane_info: [{ api_squadron_id: 1, api_slotid: 111, api_state: 0 }],
            },
            {
              api_rid: 1,
              api_distance: { api_base: 0, api_bonus: 0 },
              api_plane_info: [{ api_squadron_id: 1, api_slotid: 111, api_state: 0 }],
            },
          ],
        },
        time: 0,
      }),
    )

    expect(afterNotFound).toBe(before)
  })
})
