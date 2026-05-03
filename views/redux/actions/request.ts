import type { APIStart2GetOptionSettingRequest } from 'kcsapi'

import { createAction } from '@reduxjs/toolkit'

import type { GameRequestPayload } from './types'

export const createAPIStart2GetOptionSettingRequestAction = createAction<
  GameRequestPayload<APIStart2GetOptionSettingRequest>
>('@@Request/kcsapi/api_start2/get_option_setting')

// FIXME: Not in kcsapi package - @@Request/kcsapi/api_req_practice/battle
export interface APIReqPracticeBattlePostBody {
  api_deck_id: string
  api_enemy_id: string
  api_formation: string
  api_verno: string
}

export const createAPIReqPracticeBattleRequestAction = createAction<
  GameRequestPayload<APIReqPracticeBattlePostBody>
>('@@Request/kcsapi/api_req_practice/battle')
