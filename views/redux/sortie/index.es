/* FORMAT
 *   combinedFlag:                      // api_combined_flag
 *   sortieStatus: [false|true] * 4     // Whether a fleet is in sortie
 *   escapedPos: [] | [idx]             // Array of escapeIdx-1 and towIdx-1
 *     // 0 for fleet1Pos1, 6 for fleet2Pos1, ..., 23 for fleet4Pos6
 *   _toEscapeIdx: [idx]                // Tempvar. As in api_escape but -1
 */

const initState = {
  combinedFlag: 0,
  sortieStatus: [false, false, false, false],
  sortieMapId: 0,       // 0 for not in sortie, or the number such as `15` `342`
  escapedPos: [],
  currentNode: null,
  dropCount: 0,
  spotHistory: [],
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
        body.api_escape.api_escape_idx[0] - 1,
        body.api_escape.api_tow_idx[0] - 1,
      ]
    }
    return {
      ...state,
      dropCount,
      _toEscapeIdx,
    }
  }

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
    }
  }

  case '@@Response/kcsapi/api_req_map/next': {
    return {
      ...state,
      currentNode: body.api_no,
      // It is said api_next could be 0
      spotHistory: state.spotHistory.concat(body.api_no || []),
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
  }
  return state
}
