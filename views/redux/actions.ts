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
  APIGetMemberRequireInfoResponse,
  APIGetMemberRequireInfoRequest,
  APIReqMissionResultRequest,
  APIReqMissionResultResponse,
  APIReqPracticeBattleResultRequest,
  APIReqPracticeBattleResultResponse,
  APIReqSortieBattleresultResponse,
  APIReqKousyouGetshipResponse,
  APIReqKousyouGetshipRequest,
  APIGetMemberKdockResponse,
  APIGetMemberKdockRequest,
  APIReqKousyouCreateshipSpeedchangeResponse,
  APIReqKousyouCreateshipSpeedchangeRequest,
  // Additional imports for info reducers
  APIGetMemberDeckRequest,
  APIGetMemberDeckResponse,
  APIGetMemberMaterialRequest,
  APIGetMemberMaterialResponse,
  APIGetMemberNdockRequest,
  APIGetMemberNdockResponse,
  APIGetMemberPresetDeckRequest,
  APIGetMemberPresetDeckResponse,
  APIGetMemberQuestlistRequest,
  APIGetMemberQuestlistResponse,
  APIGetMemberShip2Request,
  APIGetMemberShip2Response,
  APIGetMemberShip3Request,
  APIGetMemberShip3Response,
  APIGetMemberShipDeckRequest,
  APIGetMemberShipDeckResponse,
  APIGetMemberSlotItemRequest,
  APIGetMemberSlotItemResponse,
  APIGetMemberUseitemRequest,
  APIGetMemberUseitemResponse,
  APIReqCombinedBattleBattleresultResponse,
  APIReqHenseiChangeRequest,
  APIReqHenseiChangeResponse,
  APIReqHenseiLockRequest,
  APIReqHenseiLockResponse,
  APIReqHenseiPresetDeleteRequest,
  APIReqHenseiPresetDeleteResponse,
  APIReqHenseiPresetRegisterRequest,
  APIReqHenseiPresetRegisterResponse,
  APIReqHenseiPresetSelectRequest,
  APIReqHenseiPresetSelectResponse,
  APIReqHokyuChargeRequest,
  APIReqHokyuChargeResponse,
  APIReqKaisouLockRequest,
  APIReqKaisouLockResponse,
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
  APIReqKousyouCreateitemRequest,
  APIReqKousyouCreateitemResponse,
  APIReqKousyouCreateshipRequest,
  APIReqKousyouCreateshipResponse,
  APIReqKousyouDestroyitem2Request,
  APIReqKousyouDestroyitem2Response,
  APIReqKousyouDestroyshipRequest,
  APIReqKousyouDestroyshipResponse,
  APIReqKousyouRemodelSlotRequest,
  APIReqKousyouRemodelSlotResponse,
  APIReqKousyouRemodelSlotlistDetailRequest,
  APIReqKousyouRemodelSlotlistDetailResponse,
  APIReqMapAnchorageRepairRequest,
  APIReqMapAnchorageRepairResponse,
  APIReqMapSelectEventmapRankRequest,
  APIReqMapSelectEventmapRankResponse,
  APIReqMapStartRequest,
  APIReqMapStartResponse,
  APIReqMemberItemuseRequest,
  APIReqMemberItemuseResponse,
  APIReqNyukyoSpeedchangeRequest,
  APIReqNyukyoSpeedchangeResponse,
  APIReqNyukyoStartRequest,
  APIReqNyukyoStartResponse,
  APIReqQuestClearitemgetRequest,
  APIReqQuestClearitemgetResponse,
  APIReqQuestStopRequest,
  APIReqQuestStopResponse,
} from 'kcsapi'

import { APIDistance, APIPlaneInfo } from 'kcsapi/api_req_air_corps/set_plane/response'

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

interface ConfigAction {
  path: string
  value: object
}

// Config
export const createConfigAction = createAction<ConfigAction>('@@Config')

// API
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

export const createAPIGetMemberRequireInfoAction = createAction<
  GameResponsePayload<APIGetMemberRequireInfoResponse, APIGetMemberRequireInfoRequest>
>('@@Response/kcsapi/api_get_member/require_info')

export const createAPIReqMissionResultResponseAction = createAction<
  GameResponsePayload<APIReqMissionResultResponse, APIReqMissionResultRequest>
>('@@Response/kcsapi/api_req_mission/result')

export const createAPIReqPracticeResultResponseAction = createAction<
  GameResponsePayload<APIReqPracticeBattleResultResponse, APIReqPracticeBattleResultRequest>
>('@@Response/kcsapi/api_req_practice/battle_result')

export const createAPIReqSortieBattleResultResponseAction = createAction<
  GameResponsePayload<APIReqSortieBattleresultResponse, undefined>
>('@@Response/kcsapi/api_req_sortie/battleresult')

export const createAPIReqKousyouGetShipResponseAction = createAction<
  GameResponsePayload<APIReqKousyouGetshipResponse, APIReqKousyouGetshipRequest>
>('@@Response/kcsapi/api_req_kousyou/getship')

export const createAPIGetMemberKdockResponseAction = createAction<
  GameResponsePayload<APIGetMemberKdockResponse[], APIGetMemberKdockRequest>
>('@@Response/kcsapi/api_get_member/kdock')

export const createAPIReqKousyouCreateShipSpeedChangeResponseAction = createAction<
  GameResponsePayload<
    APIReqKousyouCreateshipSpeedchangeResponse,
    APIReqKousyouCreateshipSpeedchangeRequest
  >
>('@@Response/kcsapi/api_req_kousyou/createship_speedchange')

export interface APIReqAirCorpsChangeDeploymentBaseRequest {
  api_area_id: string
  api_base_id: string
  api_base_id_src: string
  api_item_id: string
  api_squadron_id: string
  api_verno: string
}

export interface APIBaseItem {
  api_distance: APIDistance
  api_plane_info: APIPlaneInfo[]
  api_rid: number
}

export interface APIReqAirCorpsChangeDeploymentBaseResponse {
  api_base_items: APIBaseItem[]
}

export const createAPIReqAirCorpsChangeDeploymentBaseResponseAction = createAction<
  GameResponsePayload<
    APIReqAirCorpsChangeDeploymentBaseResponse,
    APIReqAirCorpsChangeDeploymentBaseRequest
  >
>('@@Response/kcsapi/api_req_air_corps/change_deployment_base')

// ==========================================
// Actions for views/redux/info reducers
// ==========================================

// api_get_member actions
export const createAPIGetMemberDeckResponseAction = createAction<
  GameResponsePayload<APIGetMemberDeckResponse, APIGetMemberDeckRequest>
>('@@Response/kcsapi/api_get_member/deck')

export const createAPIGetMemberMaterialResponseAction = createAction<
  GameResponsePayload<APIGetMemberMaterialResponse, APIGetMemberMaterialRequest>
>('@@Response/kcsapi/api_get_member/material')

export const createAPIGetMemberNdockResponseAction = createAction<
  GameResponsePayload<APIGetMemberNdockResponse, APIGetMemberNdockRequest>
>('@@Response/kcsapi/api_get_member/ndock')

export const createAPIGetMemberPresetDeckResponseAction = createAction<
  GameResponsePayload<APIGetMemberPresetDeckResponse, APIGetMemberPresetDeckRequest>
>('@@Response/kcsapi/api_get_member/preset_deck')

export const createAPIGetMemberQuestlistResponseAction = createAction<
  GameResponsePayload<APIGetMemberQuestlistResponse, APIGetMemberQuestlistRequest>
>('@@Response/kcsapi/api_get_member/questlist')

export const createAPIGetMemberShip2ResponseAction = createAction<
  GameResponsePayload<APIGetMemberShip2Response, APIGetMemberShip2Request>
>('@@Response/kcsapi/api_get_member/ship2')

export const createAPIGetMemberShip3ResponseAction = createAction<
  GameResponsePayload<APIGetMemberShip3Response, APIGetMemberShip3Request>
>('@@Response/kcsapi/api_get_member/ship3')

export const createAPIGetMemberShipDeckResponseAction = createAction<
  GameResponsePayload<APIGetMemberShipDeckResponse, APIGetMemberShipDeckRequest>
>('@@Response/kcsapi/api_get_member/ship_deck')

export const createAPIGetMemberSlotItemResponseAction = createAction<
  GameResponsePayload<APIGetMemberSlotItemResponse, APIGetMemberSlotItemRequest>
>('@@Response/kcsapi/api_get_member/slot_item')

export const createAPIGetMemberUseitemResponseAction = createAction<
  GameResponsePayload<APIGetMemberUseitemResponse, APIGetMemberUseitemRequest>
>('@@Response/kcsapi/api_get_member/useitem')

// api_req_combined_battle actions
export const createAPIReqCombinedBattleBattleresultResponseAction = createAction<
  GameResponsePayload<APIReqCombinedBattleBattleresultResponse, undefined>
>('@@Response/kcsapi/api_req_combined_battle/battleresult')

// api_req_hensei actions
export const createAPIReqHenseiChangeResponseAction = createAction<
  GameResponsePayload<APIReqHenseiChangeResponse, APIReqHenseiChangeRequest>
>('@@Response/kcsapi/api_req_hensei/change')

export const createAPIReqHenseiLockResponseAction = createAction<
  GameResponsePayload<APIReqHenseiLockResponse, APIReqHenseiLockRequest>
>('@@Response/kcsapi/api_req_hensei/lock')

export const createAPIReqHenseiPresetDeleteResponseAction = createAction<
  GameResponsePayload<APIReqHenseiPresetDeleteResponse, APIReqHenseiPresetDeleteRequest>
>('@@Response/kcsapi/api_req_hensei/preset_delete')

export const createAPIReqHenseiPresetRegisterResponseAction = createAction<
  GameResponsePayload<APIReqHenseiPresetRegisterResponse, APIReqHenseiPresetRegisterRequest>
>('@@Response/kcsapi/api_req_hensei/preset_register')

export const createAPIReqHenseiPresetSelectResponseAction = createAction<
  GameResponsePayload<APIReqHenseiPresetSelectResponse, APIReqHenseiPresetSelectRequest>
>('@@Response/kcsapi/api_req_hensei/preset_select')

// FIXME: Not in kcsapi package - @@Response/kcsapi/api_req_hensei/preset_order_change
export interface APIReqHenseiPresetOrderChangeRequest {
  api_verno: string
  api_preset_from: string
  api_preset_to: string
}

export interface APIReqHenseiPresetOrderChangeResponse {
  api_result: number
  api_result_msg: string
}

export const createAPIReqHenseiPresetOrderChangeResponseAction = createAction<
  GameResponsePayload<APIReqHenseiPresetOrderChangeResponse, APIReqHenseiPresetOrderChangeRequest>
>('@@Response/kcsapi/api_req_hensei/preset_order_change')

// api_req_hokyu actions
export const createAPIReqHokyuChargeResponseAction = createAction<
  GameResponsePayload<APIReqHokyuChargeResponse, APIReqHokyuChargeRequest>
>('@@Response/kcsapi/api_req_hokyu/charge')

// api_req_kaisou actions
export const createAPIReqKaisouLockResponseAction = createAction<
  GameResponsePayload<APIReqKaisouLockResponse, APIReqKaisouLockRequest>
>('@@Response/kcsapi/api_req_kaisou/lock')

export const createAPIReqKaisouMarriageResponseAction = createAction<
  GameResponsePayload<APIReqKaisouMarriageResponse, APIReqKaisouMarriageRequest>
>('@@Response/kcsapi/api_req_kaisou/marriage')

export const createAPIReqKaisouOpenExslotResponseAction = createAction<
  GameResponsePayload<APIReqKaisouOpenExslotResponse, APIReqKaisouOpenExslotRequest>
>('@@Response/kcsapi/api_req_kaisou/open_exslot')

export const createAPIReqKaisouPowerupResponseAction = createAction<
  GameResponsePayload<APIReqKaisouPowerupResponse, APIReqKaisouPowerupRequest>
>('@@Response/kcsapi/api_req_kaisou/powerup')

export const createAPIReqKaisouSlotDepriveResponseAction = createAction<
  GameResponsePayload<APIReqKaisouSlotDepriveResponse, APIReqKaisouSlotDepriveRequest>
>('@@Response/kcsapi/api_req_kaisou/slot_deprive')

export const createAPIReqKaisouSlotExchangeIndexResponseAction = createAction<
  GameResponsePayload<APIReqKaisouSlotExchangeIndexResponse, APIReqKaisouSlotExchangeIndexRequest>
>('@@Response/kcsapi/api_req_kaisou/slot_exchange_index')

// api_req_kousyou actions
export const createAPIReqKousyouCreateitemResponseAction = createAction<
  GameResponsePayload<APIReqKousyouCreateitemResponse, APIReqKousyouCreateitemRequest>
>('@@Response/kcsapi/api_req_kousyou/createitem')

export const createAPIReqKousyouCreateshipResponseAction = createAction<
  GameResponsePayload<APIReqKousyouCreateshipResponse, APIReqKousyouCreateshipRequest>
>('@@Response/kcsapi/api_req_kousyou/createship')

export const createAPIReqKousyouDestroyitem2ResponseAction = createAction<
  GameResponsePayload<APIReqKousyouDestroyitem2Response, APIReqKousyouDestroyitem2Request>
>('@@Response/kcsapi/api_req_kousyou/destroyitem2')

export const createAPIReqKousyouDestroyshipResponseAction = createAction<
  GameResponsePayload<APIReqKousyouDestroyshipResponse, APIReqKousyouDestroyshipRequest>
>('@@Response/kcsapi/api_req_kousyou/destroyship')

export const createAPIReqKousyouRemodelSlotResponseAction = createAction<
  GameResponsePayload<APIReqKousyouRemodelSlotResponse, APIReqKousyouRemodelSlotRequest>
>('@@Response/kcsapi/api_req_kousyou/remodel_slot')

export const createAPIReqKousyouRemodelSlotlistDetailResponseAction = createAction<
  GameResponsePayload<
    APIReqKousyouRemodelSlotlistDetailResponse,
    APIReqKousyouRemodelSlotlistDetailRequest
  >
>('@@Response/kcsapi/api_req_kousyou/remodel_slotlist_detail')

// api_req_map actions
export const createAPIReqMapAnchorageRepairResponseAction = createAction<
  GameResponsePayload<APIReqMapAnchorageRepairResponse, APIReqMapAnchorageRepairRequest>
>('@@Response/kcsapi/api_req_map/anchorage_repair')

export const createAPIReqMapSelectEventmapRankResponseAction = createAction<
  GameResponsePayload<APIReqMapSelectEventmapRankResponse, APIReqMapSelectEventmapRankRequest>
>('@@Response/kcsapi/api_req_map/select_eventmap_rank')

export const createAPIReqMapStartResponseAction = createAction<
  GameResponsePayload<APIReqMapStartResponse, APIReqMapStartRequest>
>('@@Response/kcsapi/api_req_map/start')

// api_req_member actions
export const createAPIReqMemberItemuseResponseAction = createAction<
  GameResponsePayload<APIReqMemberItemuseResponse, APIReqMemberItemuseRequest>
>('@@Response/kcsapi/api_req_member/itemuse')

// FIXME: Not in kcsapi package - @@Response/kcsapi/api_req_member/updatedeckname
export interface APIReqMemberUpdatedecknameRequest {
  api_verno: string
  api_deck_id: string
  api_name: string
}

export interface APIReqMemberUpdatedecknameResponse {
  api_result: number
  api_result_msg: string
}

export const createAPIReqMemberUpdatedecknameResponseAction = createAction<
  GameResponsePayload<APIReqMemberUpdatedecknameResponse, APIReqMemberUpdatedecknameRequest>
>('@@Response/kcsapi/api_req_member/updatedeckname')

// api_req_nyukyo actions
export const createAPIReqNyukyoSpeedchangeResponseAction = createAction<
  GameResponsePayload<APIReqNyukyoSpeedchangeResponse, APIReqNyukyoSpeedchangeRequest>
>('@@Response/kcsapi/api_req_nyukyo/speedchange')

export const createAPIReqNyukyoStartResponseAction = createAction<
  GameResponsePayload<APIReqNyukyoStartResponse, APIReqNyukyoStartRequest>
>('@@Response/kcsapi/api_req_nyukyo/start')

// api_req_quest actions
export const createAPIReqQuestClearitemgetResponseAction = createAction<
  GameResponsePayload<APIReqQuestClearitemgetResponse, APIReqQuestClearitemgetRequest>
>('@@Response/kcsapi/api_req_quest/clearitemget')

export const createAPIReqQuestStopResponseAction = createAction<
  GameResponsePayload<APIReqQuestStopResponse, APIReqQuestStopRequest>
>('@@Response/kcsapi/api_req_quest/stop')
