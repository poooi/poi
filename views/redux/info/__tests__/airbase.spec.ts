import { reducer } from '../airbase'

import {
  createAPIGetMemberMapinfoResponseAction,
  createAPIReqAirCorpsSetPlaneResponseAction,
  createAPIReqAirCorpsChangeNameResponseAction,
  createAPIReqAirCorpsSetActionResponseAction,
  createAPIReqAirCorpsSupplyResponseAction,
  createAPIReqMapNextResponseAction,
  createAPIPortPortResponseAction,
} from '../../actions'

import mapInfoFixture from './__fixtures__/api_get_member_mapinfo_typical.json'
import setPlaneFixture from './__fixtures__/api_req_air_corps_set_plane_assign_planes.json'
import changeNameFixture from './__fixtures__/api_req_air_corps_change_name_rename_base.json'
import setActionFixture from './__fixtures__/api_req_air_corps_set_action_bulk_update.json'
import supplyFixture from './__fixtures__/api_req_air_corps_supply_resupply_squadron.json'
import nextFixture from './__fixtures__/api_req_map_next_with_itemget.json'

import type { GameResponsePayload } from '../../actions'
import type { APIReqMapNextRequest, APIReqMapNextResponse } from 'kcsapi'

describe('airbase reduer', () => {
  const initialState = reducer([], createAPIGetMemberMapinfoResponseAction(mapInfoFixture))

  it('empty action', () => {
    // @ts-expect-error testing empty reducer
    expect(reducer(undefined, {})).toEqual([])
  })

  it('createAPIGetMemberMapinfoResponseAction', () => {
    // @ts-expect-error testing empty reducer
    expect(reducer([], createAPIGetMemberMapinfoResponseAction({ body: {} }))).toEqual([])

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
    expect(initialState).toMatchDiffSnapshot(
      // @ts-expect-error testing empty reducer
      reducer(initialState, createAPIPortPortResponseAction({})),
    )
  })

  it('createAPIReqMapNextResponseAction', () => {
    const payload: GameResponsePayload<APIReqMapNextResponse, APIReqMapNextRequest> = nextFixture
    expect(initialState).toMatchDiffSnapshot(
      reducer(initialState, createAPIReqMapNextResponseAction(payload)),
    )
  })
})
