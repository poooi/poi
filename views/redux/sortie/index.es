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

const initState = {
  combinedFlag: 0,
  sortieStatus: [false, false, false, false],
  sortieMapId: 0,       // 0 for not in sortie, or the number such as `15` `342`
  escapedPos: [],
  currentNode: null,
  dropCount: 0,
  spotHistory: [],
  item: null,
  itemHistory: [],
}

const ensureArray = x => isArray(x) ? x : [x]

const getItem = ({ api_itemget = [], api_happening = {}, api_itemget_eo_comment = {} }) => {
  const item = {}

  ensureArray(api_itemget).concat(api_itemget_eo_comment).forEach(({ api_id = 0, api_getcount = 0 } = {}) => {
    if (api_id) {
      item[api_id] = (item[api_id] || 0) + api_getcount
    }
  })

  const { api_icon_id = 0, api_count = 0 } = api_happening
  if (api_icon_id) {
    item[api_icon_id] = (item[api_icon_id] || 0) - api_count
  }

  return Object.keys(item).length ? item : undefined
}

export function reducer(state=initState, {type, path, postBody, body}) {
  switch (type) {
  case '@@Response/kcsapi/api_port/port':
    return {
      ...state,
      combinedFlag: body.api_combined_flag || 0,
      sortieStatus: initState.sortieStatus,
      escapedPos: [],
      sortieMapId: 0,
      currentNode: null,
      dropCount: 0,
      spotHistory: [],
      item: null,
      itemHistory: [],
    }

  case '@@Response/kcsapi/api_req_sortie/battleresult':
  case '@@Response/kcsapi/api_req_combined_battle/battleresult': {
    let dropCount = state.dropCount
    let _toEscapeIdx = state._toEscapeIdx
    if ((body.api_get_ship || {}).api_ship_id) {
      dropCount++
    }
    if ((body.api_escape_flag != null) && body.api_escape_flag > 0) {
      _toEscapeIdx = [
        get(body.api_escape, ['api_escape_idx', 0]) - 1,
        get(body.api_escape, ['api_tow_idx', 0]) - 1,
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
        escapedPos: (state.escapedPos || []).concat(state._toEscapeIdx),
        _toEscapeIdx: [],
      }
    }
    break

  case '@@Response/kcsapi/api_req_map/start': {
    const sortieStatus = initState.sortieStatus.slice()
    const mapId = `${postBody.api_maparea_id}${postBody.api_mapinfo_no}`
    const startSpot = body.api_from_no || 0
    if (state.combinedFlag !== 0 && postBody.api_deck_id == 1) {
      sortieStatus[0] = sortieStatus[1] = true
    } else {
      sortieStatus[postBody.api_deck_id-1] = true
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
      itemHistory: state.itemHistory.concat(item || []),
    }
  }

  case '@@Response/kcsapi/api_req_map/next': {

    const item = getItem(body)

    return {
      ...state,
      currentNode: body.api_no,
      // It is said api_next could be 0
      spotHistory: state.spotHistory.concat(body.api_no || []),
      item,
      itemHistory: state.itemHistory.concat(item || []),
    }
  }

  // sortieStatus for the fleet in practice = true
  case '@@Request/kcsapi/api_req_practice/battle': {
    const deckId = parseInt(body.api_deck_id || 1)
    const sortieStatus = initState.sortieStatus.slice()
    sortieStatus[deckId - 1] = true
    return {
      ...state,
      sortieStatus,
    }
  }
  case '@@Response/kcsapi/api_req_hensei/combined': {
    const combinedFlag = parseInt(postBody.api_combined_type)
    return {
      ...state,
      combinedFlag,
    }
  }
  }
  return state
}
