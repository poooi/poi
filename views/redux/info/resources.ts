import { map } from 'lodash'

import { compareUpdate } from 'views/utils/tools'
import { createSlice } from '@reduxjs/toolkit'
import {
  createAPIPortPortResponseAction,
  createAPIGetMemberMaterialResponseAction,
  createAPIReqHokyuChargeResponseAction,
  createAPIReqKousyouDestroyshipResponseAction,
  createAPIReqKousyouCreateitemResponseAction,
  createAPIReqKousyouRemodelSlotResponseAction,
  createAPIReqKousyouCreateshipResponseAction,
  createAPIReqKousyouCreateShipSpeedChangeResponseAction,
  createAPIReqKousyouDestroyitem2ResponseAction,
  createAPIReqNyukyoStartResponseAction,
  createAPIReqNyukyoSpeedchangeResponseAction,
  createAPIReqAirCorpsSetPlaneResponseAction,
  createAPIReqAirCorpsSupplyResponseAction,
  createInfoResourcesApplyDeltaAction,
} from '../actions'

// FORMAT
// 0: <Fuel>
// 1: <Ammo>
// 2: <Steel>
// 3: <Bauxite>
// 4: <Instant construction>
// 5: <Fast repair (bucket)>
// 6: <Development material>
// 7: <Improvement material>

export type ResourcesState = number[]

function addArrayResources(state: ResourcesState, arr: number[]): ResourcesState {
  const newState = state.slice()
  arr.forEach((n, i) => {
    newState[i] += n
  })
  return newState
}

const resourcesSlice = createSlice({
  name: 'resources',
  initialState: [] as ResourcesState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createAPIPortPortResponseAction, (state, { payload }) => {
        return compareUpdate(state, map(payload.body.api_material, 'api_value'))
      })
      .addCase(createAPIGetMemberMaterialResponseAction, (state, { payload }) => {
        return compareUpdate(
          state,
          map(payload.body as unknown as { api_value: number }[], 'api_value'),
        )
      })
      .addCase(createAPIReqHokyuChargeResponseAction, (state, { payload }) => {
        return compareUpdate(state, payload.body.api_material as unknown as number[])
      })
      .addCase(createAPIReqKousyouDestroyshipResponseAction, (state, { payload }) => {
        // These apis give only 4 resources
        return compareUpdate(state, payload.body.api_material as unknown as number[])
      })
      .addCase(createAPIReqKousyouCreateitemResponseAction, (state, { payload }) => {
        return compareUpdate(state, payload.body.api_material as unknown as number[])
      })
      .addCase(createAPIReqKousyouRemodelSlotResponseAction, (state, { payload }) => {
        return compareUpdate(state, payload.body.api_after_material as unknown as number[])
      })
      .addCase(createAPIReqKousyouCreateshipResponseAction, (state, { payload }) => {
        const newState = state.slice()
        if (parseInt(String(payload.postBody.api_highspeed)) > 0) {
          const lsc = parseInt(String(payload.postBody.api_item1)) > 1000
          newState[4] -= lsc ? 10 : 1
        }
        newState[0] -= parseInt(String(payload.postBody.api_item1))
        newState[1] -= parseInt(String(payload.postBody.api_item2))
        newState[2] -= parseInt(String(payload.postBody.api_item3))
        newState[3] -= parseInt(String(payload.postBody.api_item4))
        newState[6] -= parseInt(String(payload.postBody.api_item5))
        return newState
      })
      .addCase(createAPIReqKousyouDestroyitem2ResponseAction, (state, { payload }) => {
        return addArrayResources(state, payload.body.api_get_material as unknown as number[])
      })
      .addCase(createAPIReqNyukyoSpeedchangeResponseAction, (state) => {
        const newState = state.slice()
        newState[5] -= 1
        return newState
      })
      .addCase(createAPIReqAirCorpsSetPlaneResponseAction, (state, { payload }) => {
        const afterBauxite = (payload.body as unknown as { api_after_bauxite?: number })
          .api_after_bauxite
        if (!afterBauxite) return state
        const newState = state.slice()
        newState[3] = afterBauxite
        return newState
      })
      .addCase(createAPIReqAirCorpsSupplyResponseAction, (state, { payload }) => {
        const newState = state.slice()
        newState[0] = Number(
          (payload.body as unknown as { api_after_fuel?: number }).api_after_fuel,
        )
        newState[3] = Number(
          (payload.body as unknown as { api_after_bauxite?: number }).api_after_bauxite,
        )
        return newState
      })
  },
})

export function reducer(
  state: ResourcesState = [],
  action: { type: string; payload?: unknown },
): ResourcesState {
  switch (action.type) {
    // These cross-slice dependent cases are handled by resourcesCrossSliceMiddleware.
    // Keep the type here so the old behavior isn't accidentally reintroduced.
    case createAPIReqKousyouCreateShipSpeedChangeResponseAction.type:
    case createAPIReqNyukyoStartResponseAction.type:
      return state
    case createInfoResourcesApplyDeltaAction.type: {
      const delta = (action as ReturnType<typeof createInfoResourcesApplyDeltaAction>).payload.delta
      return addArrayResources(state, delta)
    }
    default:
      return resourcesSlice.reducer(state, action as never)
  }
}
