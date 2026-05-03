import type { APIEDeckInfo } from 'kcsapi/api_req_map/next/response'

import { createSlice, current, isAnyOf } from '@reduxjs/toolkit'
import { isArray, get } from 'lodash'

import {
  createAPIReqPracticeBattleRequestAction,
  createAPIStart2GetOptionSettingRequestAction,
} from '../actions/request'
import {
  createAPIPortPortResponseAction,
  createAPIReqBattleMidnightBattleResponseAction,
  createAPIReqBattleMidnightSPMidnightResponseAction,
  createAPIReqCombinedBattleAirbattleResponseAction,
  createAPIReqCombinedBattleBattleResponseAction,
  createAPIReqCombinedBattleBattleWaterResponseAction,
  createAPIReqCombinedBattleBattleresultResponseAction,
  createAPIReqCombinedBattleEachBattleResponseAction,
  createAPIReqCombinedBattleEachBattleWaterResponseAction,
  createAPIReqCombinedBattleEcBattleResponseAction,
  createAPIReqCombinedBattleEcMidnightBattleResponseAction,
  createAPIReqCombinedBattleEcNightToDayResponseAction,
  createAPIReqCombinedBattleGobackPortResponseAction,
  createAPIReqCombinedBattleLdAirbattleResponseAction,
  createAPIReqCombinedBattleMidnightBattleResponseAction,
  createAPIReqCombinedBattleSPMidnightResponseAction,
  createAPIReqHenseiCombinedResponseAction,
  createAPIReqMapNextResponseAction,
  createAPIReqMapStartResponseAction,
  createAPIReqSortieAirbattleResponseAction,
  createAPIReqSortieBattleResponseAction,
  createAPIReqSortieBattleResultResponseAction,
  createAPIReqSortieGobackPortResponseAction,
  createAPIReqSortieLdAirbattleResponseAction,
} from '../actions/response'

/* FORMAT
 *   combinedFlag:                      // api_combined_flag
 *   sortieStatus: [false|true] * 4     // Whether a fleet is in sortie
 *   escapedPos: [] | [idx]             // Array of escapeIdx-1 and towIdx-1
 *     // It is based on current sortie fleet (flatten if combined fleet)
 *     // Be care for the existence of 7 ship fleet
 *   _toEscapeIdx: [idx]                // Tempvar. As in api_escape but -1
 *   item:                              // item drop or lost at node, undefined if no drop / lost, {0: 0} if Tanaka loves you
 *   itemHistory:                       // Array of drop or lost history, added only when it happens, does not match spotHistory
 */

export interface SortieState {
  combinedFlag: number
  sortieStatus: [boolean, boolean, boolean, boolean]
  sortieMapId: number | string
  escapedPos: number[]
  currentNode: number | null
  dropCount: number
  spotHistory: number[]
  item: Record<number, number> | null | undefined
  itemHistory: Array<Record<number, number>>
  spAttackCount: Record<number, number>
  nextEnemyInfo: APIEDeckInfo[]
  _toEscapeIdx?: number[]
  bossSpot?: number
}

const initState: SortieState = {
  combinedFlag: 0,
  sortieStatus: [false, false, false, false],
  sortieMapId: 0,
  escapedPos: [],
  currentNode: null,
  dropCount: 0,
  spotHistory: [],
  item: null,
  itemHistory: [],
  spAttackCount: {},
  nextEnemyInfo: [],
}

const ensureArray = <T>(x: T | T[]): T[] => (isArray(x) ? x : [x])

interface ItemGetEntry {
  api_id?: number
  api_getcount?: number
}

interface ItemHappening {
  api_icon_id?: number
  api_count?: number
}

interface NodeBody {
  api_itemget?: ItemGetEntry | ItemGetEntry[]
  api_happening?: ItemHappening
  api_itemget_eo_comment?: ItemGetEntry | ItemGetEntry[]
  api_from_no?: number
  api_no: number
  api_bosscell_no?: number
  api_color_no?: number
  api_e_deck_info?: APIEDeckInfo[]
  api_combined_flag?: number
  api_get_ship?: { api_ship_id?: number }
  api_escape_flag?: number
  api_escape?: { api_escape_idx?: number[]; api_tow_idx?: number[] }
  api_maparea_id?: number
  api_mapinfo_no?: number
  api_deck_id?: number | string
  api_dock_id?: number | string
  api_hougeki1?: { api_at_type?: number[] }
  api_hougeki2?: { api_at_type?: number[] }
  api_hougeki3?: { api_at_type?: number[] }
  api_hougeki?: { api_sp_list?: number[] }
}

function getItem(
  body: Pick<NodeBody, 'api_itemget' | 'api_happening' | 'api_itemget_eo_comment'>,
): Record<number, number> | undefined {
  const item: Record<number, number> = {}

  ensureArray(body.api_itemget ?? [])
    .concat(ensureArray(body.api_itemget_eo_comment ?? []))
    .forEach(({ api_id = 0, api_getcount = 0 } = {}) => {
      if (api_id) {
        item[api_id] = (item[api_id] ?? 0) + api_getcount
      }
    })

  const { api_icon_id = 0, api_count = 0 } = body.api_happening ?? {}
  if (api_icon_id) {
    item[api_icon_id] = (item[api_icon_id] ?? 0) - api_count
  }

  return Object.keys(item).length ? item : undefined
}

const isBattlePhaseAction = isAnyOf(
  createAPIReqSortieBattleResponseAction,
  createAPIReqSortieAirbattleResponseAction,
  createAPIReqSortieLdAirbattleResponseAction,
  createAPIReqCombinedBattleBattleResponseAction,
  createAPIReqCombinedBattleBattleWaterResponseAction,
  createAPIReqCombinedBattleAirbattleResponseAction,
  createAPIReqCombinedBattleLdAirbattleResponseAction,
  createAPIReqCombinedBattleEcBattleResponseAction,
  createAPIReqCombinedBattleEachBattleResponseAction,
  createAPIReqCombinedBattleEachBattleWaterResponseAction,
  createAPIReqBattleMidnightBattleResponseAction,
  createAPIReqBattleMidnightSPMidnightResponseAction,
  createAPIReqCombinedBattleMidnightBattleResponseAction,
  createAPIReqCombinedBattleSPMidnightResponseAction,
  createAPIReqCombinedBattleEcMidnightBattleResponseAction,
  createAPIReqCombinedBattleEcNightToDayResponseAction,
)

const sortieSlice = createSlice({
  name: 'sortie',
  initialState: initState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createAPIPortPortResponseAction, (state, { payload }) => ({
        ...current(state),
        // note that get_incentive doesn't have this field.
        combinedFlag: get(payload.body, 'api_combined_flag', 0) as number,
        sortieStatus: initState.sortieStatus,
        escapedPos: [],
        sortieMapId: 0,
        currentNode: null,
        dropCount: 0,
        spotHistory: [],
        item: null,
        itemHistory: [],
        spAttackCount: {},
        nextEnemyInfo: [],
      }))
      .addCase(createAPIStart2GetOptionSettingRequestAction, (state) => ({
        ...current(state),
        combinedFlag: 0,
        sortieStatus: initState.sortieStatus,
        escapedPos: [],
        sortieMapId: 0,
        currentNode: null,
        dropCount: 0,
        spotHistory: [],
        item: null,
        itemHistory: [],
        spAttackCount: {},
        nextEnemyInfo: [],
      }))
      .addCase(createAPIReqSortieBattleResultResponseAction, (state, { payload }) => {
        const body = payload.body
        const s = current(state)
        let dropCount = s.dropCount
        let _toEscapeIdx = s._toEscapeIdx
        if (body?.api_get_ship?.api_ship_id) {
          dropCount++
        }
        if (body?.api_escape_flag != null && body.api_escape_flag > 0) {
          _toEscapeIdx = [
            get(body.api_escape, ['api_escape_idx', 0], -1) - 1,
            get(body.api_escape, ['api_tow_idx', 0], -1) - 1,
          ].filter(Number.isFinite)
        }
        return { ...s, dropCount, _toEscapeIdx }
      })
      .addCase(createAPIReqCombinedBattleBattleresultResponseAction, (state, { payload }) => {
        const body = payload.body
        const s = current(state)
        let dropCount = s.dropCount
        let _toEscapeIdx = s._toEscapeIdx
        if (body?.api_get_ship?.api_ship_id) {
          dropCount++
        }
        if (body?.api_escape_flag != null && body.api_escape_flag > 0) {
          _toEscapeIdx = [
            get(body.api_escape, ['api_escape_idx', 0], -1) - 1,
            get(body.api_escape, ['api_tow_idx', 0], -1) - 1,
          ].filter(Number.isFinite)
        }
        return { ...s, dropCount, _toEscapeIdx }
      })
      .addCase(createAPIReqSortieGobackPortResponseAction, (state) => {
        if (state._toEscapeIdx) {
          const s = current(state)
          return {
            ...s,
            escapedPos: (s.escapedPos ?? []).concat(s._toEscapeIdx ?? []),
            _toEscapeIdx: [],
          }
        }
      })
      .addCase(createAPIReqCombinedBattleGobackPortResponseAction, (state) => {
        if (state._toEscapeIdx) {
          const s = current(state)
          return {
            ...s,
            escapedPos: (s.escapedPos ?? []).concat(s._toEscapeIdx ?? []),
            _toEscapeIdx: [],
          }
        }
      })
      .addCase(createAPIReqMapStartResponseAction, (state, { payload }) => {
        const { body, postBody } = payload
        if (!body || !postBody) return
        const s = current(state)
        const sortieStatus: [boolean, boolean, boolean, boolean] = [false, false, false, false]
        const mapId = `${postBody.api_maparea_id}${postBody.api_mapinfo_no}`
        const startSpot = body.api_from_no ?? 0
        const deckId = Number(postBody.api_deck_id)
        if (s.combinedFlag !== 0 && deckId === 1) {
          sortieStatus[0] = sortieStatus[1] = true
        } else {
          sortieStatus[deckId - 1] = true
        }
        const bodyAsNode = body
        const item = getItem(bodyAsNode)
        return {
          ...s,
          sortieMapId: mapId,
          currentNode: bodyAsNode.api_no,
          sortieStatus,
          escapedPos: [],
          _toEscapeIdx: [],
          dropCount: 0,
          spotHistory: [startSpot, bodyAsNode.api_no],
          bossSpot: bodyAsNode.api_bosscell_no,
          item,
          itemHistory: s.itemHistory.concat(item ?? []),
          nextEnemyInfo: bodyAsNode.api_e_deck_info ?? [],
        }
      })
      .addCase(createAPIReqMapNextResponseAction, (state, { payload }) => {
        const body = payload.body
        if (!body) return
        const s = current(state)
        const item = getItem(body)
        return {
          ...s,
          currentNode: body.api_no,
          // It is said api_next could be 0
          spotHistory: s.spotHistory.concat(body.api_no || []),
          item,
          itemHistory: s.itemHistory.concat(item ?? []),
          nextEnemyInfo: body.api_e_deck_info ?? [],
        }
      })
      .addCase(createAPIReqPracticeBattleRequestAction, (state, { payload }) => {
        const deckId = parseInt(String(payload.body?.api_deck_id ?? 1))
        const sortieStatus: [boolean, boolean, boolean, boolean] = [false, false, false, false]
        sortieStatus[deckId - 1] = true
        return { ...current(state), sortieStatus }
      })
      .addCase(createAPIReqHenseiCombinedResponseAction, (state, { payload }) => {
        const combinedFlag = parseInt(String(payload.postBody?.api_combined_type))
        return { ...current(state), combinedFlag }
      })
      .addMatcher(isBattlePhaseAction, (state, action) => {
        const body = action.payload.body
        const spAttackIds: number[] = []
        if (
          'api_hougeki1' in body &&
          body.api_hougeki1 &&
          'api_at_type' in body.api_hougeki1 &&
          body.api_hougeki1.api_at_type
        ) {
          spAttackIds.push(...body.api_hougeki1.api_at_type.filter((a) => a >= 100))
        }
        if (
          'api_hougeki2' in body &&
          body.api_hougeki2 &&
          'api_at_type' in body.api_hougeki2 &&
          body.api_hougeki2.api_at_type
        ) {
          spAttackIds.push(...body.api_hougeki2.api_at_type.filter((a) => a >= 100))
        }
        if (
          'api_hougeki3' in body &&
          body.api_hougeki3 &&
          'api_at_type' in body.api_hougeki3 &&
          body.api_hougeki3.api_at_type
        ) {
          spAttackIds.push(...body.api_hougeki3.api_at_type.filter((a) => a >= 100))
        }
        if (
          'api_hougeki' in body &&
          body.api_hougeki &&
          'api_sp_list' in body.api_hougeki &&
          body.api_hougeki.api_sp_list
        ) {
          spAttackIds.push(...body.api_hougeki.api_sp_list.filter((a) => a >= 100))
        }
        if (spAttackIds.length > 0) {
          const spAttackCount = { ...state.spAttackCount }
          spAttackIds.forEach((id) => (spAttackCount[id] = (spAttackCount[id] ?? 0) + 1))
          state.spAttackCount = spAttackCount
        }
        if (state.nextEnemyInfo.length !== 0) {
          state.nextEnemyInfo = []
        }
      })
  },
})

export const reducer = sortieSlice.reducer
