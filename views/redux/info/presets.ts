import { reduxSet, compareUpdate } from 'views/utils/tools'
import { omit } from 'lodash'

import { createSlice } from '@reduxjs/toolkit'

import { APIDeck as KcsapiPresetDeck } from 'kcsapi/api_get_member/preset_deck/response'

import {
  createAPIGetMemberPresetDeckResponseAction,
  createAPIReqHenseiPresetDeleteResponseAction,
  createAPIReqHenseiPresetRegisterResponseAction,
  createAPIReqHenseiPresetOrderChangeResponseAction,
} from '../actions'

export type PresetDeck = KcsapiPresetDeck

export interface PresetsState {
  api_max_num: number
  api_deck: Record<string, PresetDeck>
}

export type Action =
  | ReturnType<typeof createAPIGetMemberPresetDeckResponseAction>
  | ReturnType<typeof createAPIReqHenseiPresetRegisterResponseAction>
  | ReturnType<typeof createAPIReqHenseiPresetDeleteResponseAction>
  | ReturnType<typeof createAPIReqHenseiPresetOrderChangeResponseAction>
  | { type: string; body?: unknown; postBody?: unknown }

const initState: PresetsState = {
  api_max_num: 0,
  api_deck: {},
}

const presetsSlice = createSlice({
  name: 'presets',
  initialState: initState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createAPIGetMemberPresetDeckResponseAction, (state, { payload }) => {
        return {
          ...state,
          api_max_num: payload.body.api_max_num,
          api_deck: compareUpdate(state.api_deck, payload.body.api_deck, 3),
        }
      })
      .addCase(createAPIReqHenseiPresetRegisterResponseAction, (state, { payload }) => {
        const { api_preset_no } = payload.body
        return {
          ...state,
          api_deck: reduxSet(state.api_deck, [String(api_preset_no)], payload.body),
        }
      })
      .addCase(createAPIReqHenseiPresetDeleteResponseAction, (state, { payload }) => {
        const { api_preset_no } = payload.postBody // it's a String
        return {
          ...state,
          api_deck: omit(state.api_deck, api_preset_no),
        }
      })
      .addCase(createAPIReqHenseiPresetOrderChangeResponseAction, (state, { payload }) => {
        // This action is triggered by dragging one preset (api_preset_from)
        // to another preset position (api_preset_to).
        // Note that we are implementing as if both values may not exist, just to be safe.
        const { api_preset_from, api_preset_to } = payload.postBody

        const vFrom = state.api_deck[api_preset_from]
        const vTo = state.api_deck[api_preset_to]

        if (!vFrom && !vTo) {
          // none
          return state
        }

        const newDeck = { ...state.api_deck }

        if (vFrom) delete newDeck[api_preset_from]
        if (vTo) delete newDeck[api_preset_to]

        if (vFrom) {
          newDeck[api_preset_to] = {
            ...vFrom,
            api_preset_no: parseInt(api_preset_to, 10),
          }
        }

        if (vTo) {
          newDeck[api_preset_from] = {
            ...vTo,
            api_preset_no: parseInt(api_preset_from, 10),
          }
        }

        return { ...state, api_deck: newDeck }
      })
  },
})

const reducer = presetsSlice.reducer

export default reducer
