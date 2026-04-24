import { isArray, get } from 'lodash'

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
  nextEnemyInfo: unknown[]
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
  api_e_deck_info?: unknown[]
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

interface PostBody {
  api_maparea_id?: string | number
  api_mapinfo_no?: string | number
  api_deck_id?: string | number
  api_combined_type?: string | number
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

type SortieAction = { type: string; path?: string; postBody?: PostBody; body?: NodeBody }

export function reducer(state = initState, { type, postBody, body }: SortieAction): SortieState {
  switch (type) {
    /*
       Clear sortie state if we have returned to port (api_port/port)
       or if we have reloaded in the middle of a sortie, in which case
       `kcsapi/api_start2/get_option_setting`
       is the first API that game calls.
     */
    case '@@Response/kcsapi/api_port/port':
    case '@@Request/kcsapi/api_start2/get_option_setting':
      return {
        ...state,
        combinedFlag:
          // note that get_incentive doesn't have this field.
          get(body, 'api_combined_flag', 0),
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
      }

    case '@@Response/kcsapi/api_req_sortie/battleresult':
    case '@@Response/kcsapi/api_req_combined_battle/battleresult': {
      let dropCount = state.dropCount
      let _toEscapeIdx = state._toEscapeIdx
      if (body?.api_get_ship?.api_ship_id) {
        dropCount++
      }
      if (body?.api_escape_flag != null && body.api_escape_flag > 0) {
        _toEscapeIdx = [
          get(body.api_escape, ['api_escape_idx', 0], -1) - 1,
          get(body.api_escape, ['api_tow_idx', 0], -1) - 1,
        ].filter(Number.isFinite)
      }
      return {
        ...state,
        dropCount,
        _toEscapeIdx,
      }
    }

    case '@@Response/kcsapi/api_req_sortie/goback_port':
    case '@@Response/kcsapi/api_req_combined_battle/goback_port':
      if (state._toEscapeIdx) {
        return {
          ...state,
          escapedPos: (state.escapedPos ?? []).concat(state._toEscapeIdx),
          _toEscapeIdx: [],
        }
      }
      break

    case '@@Response/kcsapi/api_req_map/start': {
      if (!body || !postBody) return state
      const sortieStatus: [boolean, boolean, boolean, boolean] = [false, false, false, false]
      const mapId = `${postBody.api_maparea_id}${postBody.api_mapinfo_no}`
      const startSpot = body.api_from_no ?? 0
      const deckId = Number(postBody.api_deck_id)
      if (state.combinedFlag !== 0 && deckId === 1) {
        sortieStatus[0] = sortieStatus[1] = true
      } else {
        sortieStatus[deckId - 1] = true
      }

      const item = getItem(body)

      return {
        ...state,
        sortieMapId: mapId,
        currentNode: body.api_no,
        sortieStatus,
        escapedPos: [],
        _toEscapeIdx: [],
        dropCount: 0,
        spotHistory: [startSpot, body.api_no],
        bossSpot: body.api_bosscell_no,
        item,
        itemHistory: state.itemHistory.concat(item ?? []),
        nextEnemyInfo: body.api_e_deck_info ?? [],
      }
    }

    case '@@Response/kcsapi/api_req_map/next': {
      if (!body) return state
      const item = getItem(body)

      return {
        ...state,
        currentNode: body.api_no,
        // It is said api_next could be 0
        spotHistory: state.spotHistory.concat(body.api_no || []),
        item,
        itemHistory: state.itemHistory.concat(item ?? []),
        nextEnemyInfo: body.api_e_deck_info ?? [],
      }
    }

    // sortieStatus for the fleet in practice = true
    case '@@Request/kcsapi/api_req_practice/battle': {
      const deckId = parseInt(String(body?.api_deck_id ?? 1))
      const sortieStatus: [boolean, boolean, boolean, boolean] = [false, false, false, false]
      sortieStatus[deckId - 1] = true
      return {
        ...state,
        sortieStatus,
      }
    }
    case '@@Response/kcsapi/api_req_hensei/combined': {
      const combinedFlag = parseInt(String(postBody?.api_combined_type))
      return {
        ...state,
        combinedFlag,
      }
    }
  }
  let newState = state
  const spAttackIds = [
    ...get(body, 'api_hougeki1.api_at_type', [] as number[]),
    ...get(body, 'api_hougeki2.api_at_type', [] as number[]),
    ...get(body, 'api_hougeki3.api_at_type', [] as number[]),
    ...get(body, 'api_hougeki.api_sp_list', [] as number[]),
  ].filter((a) => a >= 100)
  if (spAttackIds.length > 0) {
    const spAttackCount = {
      ...state.spAttackCount,
    }
    spAttackIds.forEach((id) => (spAttackCount[id] = (spAttackCount[id] ?? 0) + 1))
    newState = {
      ...state,
      spAttackCount,
    }
  }
  if (type.includes('battle') && newState.nextEnemyInfo.length !== 0) {
    newState = {
      ...newState,
      nextEnemyInfo: [],
    }
  }
  return newState
}
