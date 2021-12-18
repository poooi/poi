import { createAction } from '@reduxjs/toolkit'
import {
  APIGetMemberMapinfoRequest,
  APIGetMemberMapinfoResponse,
  APIReqAirCorpsSetPlaneRequest,
  APIReqAirCorpsSetPlaneResponse,
  APIReqAirCorpsSetActionRequest,
  APIReqAirCorpsSetActionResponse,
  APIReqAirCorpsSupplyRequest,
  APIReqAirCorpsSupplyResponse,
  APIReqMapNextRequest,
  APIReqMapNextResponse,
  APIPortPortRequest,
  APIPortPortResponse,
} from 'kcsapi'

interface GameResponsePayload<Body, PostBody> {
  method: string
  path: string
  body: Body
  postBody: PostBody
  time: number
}

// FIXME: @@Response/kcsapi/api_req_air_corps/change_name
interface APIReqAirCorpsChangeNameRequest {
  api_verno: string
  api_area_id: string
  api_base_id: string
  api_name: string
}

interface APIReqAirCorpsChangeNameResponse {
  api_result: number
  api_result_msg: string
}

export const createAPIGetMemberMapinfoResponseAction = createAction<
  GameResponsePayload<APIGetMemberMapinfoResponse, APIGetMemberMapinfoRequest>
>('@@Response/kcsapi/api_get_member/mapinfo')

export const createAPIReqAirCorpsSetPlaneResponseAction = createAction<
  GameResponsePayload<APIReqAirCorpsSetPlaneResponse, APIReqAirCorpsSetPlaneRequest>
>('@@Response/kcsapi/api_req_air_corps/set_plane')

export const createAPIReqAirCorpsChangeNameResponseAction = createAction<
  GameResponsePayload<APIReqAirCorpsChangeNameResponse, APIReqAirCorpsChangeNameRequest>
>('@@Response/kcsapi/api_req_air_corps/change_name')

export const createAPIReqAirCorpsSetActionResponseAction = createAction<
  GameResponsePayload<APIReqAirCorpsSetActionResponse, APIReqAirCorpsSetActionRequest>
>('@@Response/kcsapi/api_req_air_corps/set_action')

export const createAPIReqAirCorpsSupplyResponseAction = createAction<
  GameResponsePayload<APIReqAirCorpsSupplyResponse, APIReqAirCorpsSupplyRequest>
>('@@Response/kcsapi/api_req_air_corps/supply')

export const createAPIReqMapNextResponseAction = createAction<
  GameResponsePayload<APIReqMapNextResponse, APIReqMapNextRequest>
>('@@Response/kcsapi/api_req_map/next')

export const createAPIPortPortResponseAction = createAction<
  GameResponsePayload<APIPortPortResponse, APIPortPortRequest>
>('@@Response/kcsapi/api_port/port')
