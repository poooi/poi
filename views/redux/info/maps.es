const { indexify, compareUpdate } = window

export function reducer(state={}, {type, body, postBody}) {
  // Compatibility: Old api arranges maps in array
  if (Array.isArray(state))
    state = window.indexify(state.filter((e) => (e && e.api_id)))
  switch (type) {
  case '@@Response/kcsapi/api_get_member/mapinfo':
    return compareUpdate(state, indexify(body), 2)
  case '@@Response/kcsapi/api_req_map/select_eventmap_rank': {
    const id = `${postBody.api_maparea_id}${postBody.api_map_no}`
    return window.reduxSet(state,
      [id, 'api_eventmap', 'api_selected_rank'], parseInt(postBody.api_rank))
  }
  case '@@Response/kcsapi/api_req_map/start': {
    const {api_eventmap} = body
    const id = `${postBody.api_maparea_id}${postBody.api_mapinfo_no}`
    if (api_eventmap) {
      const {api_max_maphp, api_now_maphp} = api_eventmap
      return window.compareUpdate(state, {
        [id]: {
          api_eventmap: {
            api_max_maphp,
            api_now_maphp,
          },
        },
      }, 3)
    }
    break
  }
  }
  return state
}
