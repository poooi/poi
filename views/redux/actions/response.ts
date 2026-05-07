import type {
  APIStart2GetDataRequest,
  APIStart2GetDataResponse,
  APIReqSortieBattleRequest,
  APIReqSortieBattleResponse,
  APIReqSortieAirbattleRequest,
  APIReqSortieAirbattleResponse,
  APIReqSortieLdAirbattleRequest,
  APIReqSortieLdAirbattleResponse,
  APIReqSortieGobackPortRequest,
  APIReqSortieGobackPortResponse,
  APIReqCombinedBattleBattleRequest,
  APIReqCombinedBattleBattleResponse,
  APIReqCombinedBattleBattleWaterRequest,
  APIReqCombinedBattleBattleWaterResponse,
  APIReqCombinedBattleEachBattleRequest,
  APIReqCombinedBattleEachBattleResponse,
  APIReqCombinedBattleEachBattleWaterRequest,
  APIReqCombinedBattleEachBattleWaterResponse,
  APIReqCombinedBattleEcBattleRequest,
  APIReqCombinedBattleEcBattleResponse,
  APIReqCombinedBattleLdAirbattleRequest,
  APIReqCombinedBattleLdAirbattleResponse,
  APIReqCombinedBattleMidnightBattleRequest,
  APIReqCombinedBattleMidnightBattleResponse,
  APIReqCombinedBattleEcMidnightBattleRequest,
  APIReqCombinedBattleEcMidnightBattleResponse,
  APIReqCombinedBattleGobackPortRequest,
  APIReqCombinedBattleGobackPortResponse,
  APIReqBattleMidnightBattleRequest,
  APIReqBattleMidnightBattleResponse,
  APIReqBattleMidnightSPMidnightRequest,
  APIReqBattleMidnightSPMidnightResponse,
  APIReqHenseiCombinedRequest,
  APIReqHenseiCombinedResponse,
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
  APIReqAirCorpsChangeNameResponse,
  APIReqAirCorpsChangeNameRequest,
  APIReqAirCorpsChangeDeploymentBaseResponse,
  APIReqAirCorpsChangeDeploymentBaseRequest,
  APIReqHenseiPresetOrderChangeResponse,
  APIReqHenseiPresetOrderChangeRequest,
  APIReqMemberUpdatedecknameResponse,
  APIReqMemberUpdatedecknameRequest,
  APIReqKousyouRemodelSlotRecoverResponse,
  APIReqKousyouRemodelSlotRecoverRequest,
} from 'kcsapi'

import { createAction } from '@reduxjs/toolkit'

import type { GameResponsePayload } from './types'

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

export const createAPIReqAirCorpsChangeDeploymentBaseResponseAction = createAction<
  GameResponsePayload<
    APIReqAirCorpsChangeDeploymentBaseResponse,
    APIReqAirCorpsChangeDeploymentBaseRequest
  >
>('@@Response/kcsapi/api_req_air_corps/change_deployment_base')

export const createAPIGetMemberDeckResponseAction = createAction<
  // NOTE: kcsapi exports the element type; this endpoint's body is an array in practice.
  GameResponsePayload<APIGetMemberDeckResponse[], APIGetMemberDeckRequest>
>('@@Response/kcsapi/api_get_member/deck')

export const createAPIGetMemberMaterialResponseAction = createAction<
  // NOTE: kcsapi exports the element type; this endpoint's body is an array in practice.
  GameResponsePayload<APIGetMemberMaterialResponse[], APIGetMemberMaterialRequest>
>('@@Response/kcsapi/api_get_member/material')

export const createAPIGetMemberNdockResponseAction = createAction<
  // NOTE: kcsapi exports the element type; this endpoint's body is an array in practice.
  GameResponsePayload<APIGetMemberNdockResponse[], APIGetMemberNdockRequest>
>('@@Response/kcsapi/api_get_member/ndock')

export const createAPIGetMemberPresetDeckResponseAction = createAction<
  GameResponsePayload<APIGetMemberPresetDeckResponse, APIGetMemberPresetDeckRequest>
>('@@Response/kcsapi/api_get_member/preset_deck')

export const createAPIGetMemberQuestlistResponseAction = createAction<
  GameResponsePayload<APIGetMemberQuestlistResponse, APIGetMemberQuestlistRequest>
>('@@Response/kcsapi/api_get_member/questlist')

export const createAPIGetMemberShip2ResponseAction = createAction<
  // NOTE: kcsapi exports the element type; this endpoint's body is an array in practice.
  // NOTE: response-saver payloads may omit fields that kcsapi requires (e.g. api_sally_area).
  GameResponsePayload<
    Array<Partial<APIGetMemberShip2Response> & { api_id: number }>,
    APIGetMemberShip2Request
  >
>('@@Response/kcsapi/api_get_member/ship2')

export const createAPIGetMemberShip3ResponseAction = createAction<
  GameResponsePayload<APIGetMemberShip3Response, APIGetMemberShip3Request>
>('@@Response/kcsapi/api_get_member/ship3')

export const createAPIGetMemberShipDeckResponseAction = createAction<
  GameResponsePayload<APIGetMemberShipDeckResponse, APIGetMemberShipDeckRequest>
>('@@Response/kcsapi/api_get_member/ship_deck')

export const createAPIGetMemberSlotItemResponseAction = createAction<
  // NOTE: kcsapi exports the element type; this endpoint's body is an array in practice.
  GameResponsePayload<APIGetMemberSlotItemResponse[], APIGetMemberSlotItemRequest>
>('@@Response/kcsapi/api_get_member/slot_item')

export const createAPIGetMemberUseitemResponseAction = createAction<
  // NOTE: kcsapi exports the element type; this endpoint's body is an array in practice.
  GameResponsePayload<APIGetMemberUseitemResponse[], APIGetMemberUseitemRequest>
>('@@Response/kcsapi/api_get_member/useitem')

export const createAPIReqCombinedBattleBattleresultResponseAction = createAction<
  GameResponsePayload<APIReqCombinedBattleBattleresultResponse, undefined>
>('@@Response/kcsapi/api_req_combined_battle/battleresult')

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

export const createAPIReqHenseiPresetOrderChangeResponseAction = createAction<
  GameResponsePayload<APIReqHenseiPresetOrderChangeResponse, APIReqHenseiPresetOrderChangeRequest>
>('@@Response/kcsapi/api_req_hensei/preset_order_change')

export const createAPIReqHokyuChargeResponseAction = createAction<
  GameResponsePayload<APIReqHokyuChargeResponse, APIReqHokyuChargeRequest>
>('@@Response/kcsapi/api_req_hokyu/charge')

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

export const createAPIReqKousyouRemodelSlotRecoverResponseAction = createAction<
  GameResponsePayload<
    APIReqKousyouRemodelSlotRecoverResponse,
    APIReqKousyouRemodelSlotRecoverRequest
  >
>('@@Response/kcsapi/api_req_kousyou/remodel_slot_recover')

export const createAPIReqMapAnchorageRepairResponseAction = createAction<
  GameResponsePayload<APIReqMapAnchorageRepairResponse, APIReqMapAnchorageRepairRequest>
>('@@Response/kcsapi/api_req_map/anchorage_repair')

export const createAPIReqMapSelectEventmapRankResponseAction = createAction<
  GameResponsePayload<APIReqMapSelectEventmapRankResponse, APIReqMapSelectEventmapRankRequest>
>('@@Response/kcsapi/api_req_map/select_eventmap_rank')

export const createAPIReqMapStartResponseAction = createAction<
  GameResponsePayload<APIReqMapStartResponse, APIReqMapStartRequest>
>('@@Response/kcsapi/api_req_map/start')

export const createAPIReqMemberItemuseResponseAction = createAction<
  GameResponsePayload<APIReqMemberItemuseResponse, APIReqMemberItemuseRequest>
>('@@Response/kcsapi/api_req_member/itemuse')

export const createAPIReqMemberUpdatedecknameResponseAction = createAction<
  GameResponsePayload<APIReqMemberUpdatedecknameResponse, APIReqMemberUpdatedecknameRequest>
>('@@Response/kcsapi/api_req_member/updatedeckname')

export const createAPIReqNyukyoSpeedchangeResponseAction = createAction<
  GameResponsePayload<APIReqNyukyoSpeedchangeResponse, APIReqNyukyoSpeedchangeRequest>
>('@@Response/kcsapi/api_req_nyukyo/speedchange')

export const createAPIReqNyukyoStartResponseAction = createAction<
  GameResponsePayload<APIReqNyukyoStartResponse, APIReqNyukyoStartRequest>
>('@@Response/kcsapi/api_req_nyukyo/start')

export const createAPIReqQuestClearitemgetResponseAction = createAction<
  GameResponsePayload<APIReqQuestClearitemgetResponse, APIReqQuestClearitemgetRequest>
>('@@Response/kcsapi/api_req_quest/clearitemget')

export const createAPIReqQuestStopResponseAction = createAction<
  GameResponsePayload<APIReqQuestStopResponse, APIReqQuestStopRequest>
>('@@Response/kcsapi/api_req_quest/stop')

export const createAPIStart2GetDataResponseAction = createAction<
  GameResponsePayload<APIStart2GetDataResponse, APIStart2GetDataRequest>
>('@@Response/kcsapi/api_start2/getData')

export const createAPIReqSortieGobackPortResponseAction = createAction<
  GameResponsePayload<APIReqSortieGobackPortResponse, APIReqSortieGobackPortRequest>
>('@@Response/kcsapi/api_req_sortie/goback_port')

export const createAPIReqCombinedBattleGobackPortResponseAction = createAction<
  GameResponsePayload<APIReqCombinedBattleGobackPortResponse, APIReqCombinedBattleGobackPortRequest>
>('@@Response/kcsapi/api_req_combined_battle/goback_port')

export const createAPIReqHenseiCombinedResponseAction = createAction<
  GameResponsePayload<APIReqHenseiCombinedResponse, APIReqHenseiCombinedRequest>
>('@@Response/kcsapi/api_req_hensei/combined')

export const createAPIReqSortieBattleResponseAction = createAction<
  GameResponsePayload<APIReqSortieBattleResponse, APIReqSortieBattleRequest>
>('@@Response/kcsapi/api_req_sortie/battle')

export const createAPIReqSortieAirbattleResponseAction = createAction<
  GameResponsePayload<APIReqSortieAirbattleResponse, APIReqSortieAirbattleRequest>
>('@@Response/kcsapi/api_req_sortie/airbattle')

export const createAPIReqSortieLdAirbattleResponseAction = createAction<
  GameResponsePayload<APIReqSortieLdAirbattleResponse, APIReqSortieLdAirbattleRequest>
>('@@Response/kcsapi/api_req_sortie/ld_airbattle')

export const createAPIReqCombinedBattleBattleResponseAction = createAction<
  GameResponsePayload<APIReqCombinedBattleBattleResponse, APIReqCombinedBattleBattleRequest>
>('@@Response/kcsapi/api_req_combined_battle/battle')

export const createAPIReqCombinedBattleBattleWaterResponseAction = createAction<
  GameResponsePayload<
    APIReqCombinedBattleBattleWaterResponse,
    APIReqCombinedBattleBattleWaterRequest
  >
>('@@Response/kcsapi/api_req_combined_battle/battle_water')

// FIXME: Not in kcsapi package - @@Response/kcsapi/api_req_combined_battle/airbattle
export const createAPIReqCombinedBattleAirbattleResponseAction = createAction<
  GameResponsePayload<
    APIReqCombinedBattleLdAirbattleResponse,
    APIReqCombinedBattleLdAirbattleRequest
  >
>('@@Response/kcsapi/api_req_combined_battle/airbattle')

export const createAPIReqCombinedBattleLdAirbattleResponseAction = createAction<
  GameResponsePayload<
    APIReqCombinedBattleLdAirbattleResponse,
    APIReqCombinedBattleLdAirbattleRequest
  >
>('@@Response/kcsapi/api_req_combined_battle/ld_airbattle')

export const createAPIReqCombinedBattleEcBattleResponseAction = createAction<
  GameResponsePayload<APIReqCombinedBattleEcBattleResponse, APIReqCombinedBattleEcBattleRequest>
>('@@Response/kcsapi/api_req_combined_battle/ec_battle')

export const createAPIReqCombinedBattleEachBattleResponseAction = createAction<
  GameResponsePayload<APIReqCombinedBattleEachBattleResponse, APIReqCombinedBattleEachBattleRequest>
>('@@Response/kcsapi/api_req_combined_battle/each_battle')

export const createAPIReqCombinedBattleEachBattleWaterResponseAction = createAction<
  GameResponsePayload<
    APIReqCombinedBattleEachBattleWaterResponse,
    APIReqCombinedBattleEachBattleWaterRequest
  >
>('@@Response/kcsapi/api_req_combined_battle/each_battle_water')

export const createAPIReqBattleMidnightBattleResponseAction = createAction<
  GameResponsePayload<APIReqBattleMidnightBattleResponse, APIReqBattleMidnightBattleRequest>
>('@@Response/kcsapi/api_req_battle_midnight/battle')

export const createAPIReqBattleMidnightSPMidnightResponseAction = createAction<
  GameResponsePayload<APIReqBattleMidnightSPMidnightResponse, APIReqBattleMidnightSPMidnightRequest>
>('@@Response/kcsapi/api_req_battle_midnight/sp_midnight')

export const createAPIReqCombinedBattleMidnightBattleResponseAction = createAction<
  GameResponsePayload<
    APIReqCombinedBattleMidnightBattleResponse,
    APIReqCombinedBattleMidnightBattleRequest
  >
>('@@Response/kcsapi/api_req_combined_battle/midnight_battle')

// FIXME: Not in kcsapi package - @@Response/kcsapi/api_req_combined_battle/sp_midnight
export const createAPIReqCombinedBattleSPMidnightResponseAction = createAction<
  GameResponsePayload<
    APIReqCombinedBattleMidnightBattleResponse,
    APIReqCombinedBattleMidnightBattleRequest
  >
>('@@Response/kcsapi/api_req_combined_battle/sp_midnight')

export const createAPIReqCombinedBattleEcMidnightBattleResponseAction = createAction<
  GameResponsePayload<
    APIReqCombinedBattleEcMidnightBattleResponse,
    APIReqCombinedBattleEcMidnightBattleRequest
  >
>('@@Response/kcsapi/api_req_combined_battle/ec_midnight_battle')

// FIXME: Not in kcsapi package - @@Response/kcsapi/api_req_combined_battle/ec_night_to_day
export const createAPIReqCombinedBattleEcNightToDayResponseAction = createAction<
  GameResponsePayload<
    APIReqCombinedBattleEcMidnightBattleResponse,
    APIReqCombinedBattleEcMidnightBattleRequest
  >
>('@@Response/kcsapi/api_req_combined_battle/ec_night_to_day')
