import type { APIReqPracticeBattleRequest, APIStart2GetOptionSettingRequest } from 'kcsapi'

import { createAction } from '@reduxjs/toolkit'

import type { GameRequestPayload } from './types'

export const createAPIStart2GetOptionSettingRequestAction = createAction<
  GameRequestPayload<APIStart2GetOptionSettingRequest>
>('@@Request/kcsapi/api_start2/get_option_setting')

export const createAPIReqPracticeBattleRequestAction = createAction<
  GameRequestPayload<APIReqPracticeBattleRequest>
>('@@Request/kcsapi/api_req_practice/battle')
