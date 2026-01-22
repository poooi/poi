import { mapValues } from 'lodash'
import { indexify, compareUpdate, pickExisting } from 'views/utils/tools'

export interface MapEventInfo {
  api_selected_rank?: number
  api_max_maphp?: number
  api_now_maphp?: number
  [key: string]: unknown
}

export interface MapInfo {
  api_id?: number
  api_eventmap?: MapEventInfo
  [key: string]: unknown
}

export interface MapsState {
  [key: string]: MapInfo
}

interface Action {
  type: string
  body?: {
    api_map_info?: MapInfo[]
    api_maphp?: Record<string, number | string>
    api_eventmap?: {
      api_max_maphp?: number
      api_now_maphp?: number
    }
    [key: string]: unknown
  }
  postBody?: {
    api_maparea_id?: string
    api_map_no?: string
    api_mapinfo_no?: string
    api_rank?: string
    [key: string]: unknown
  }
}

export function reducer(state: MapsState = {}, { type, body, postBody }: Action): MapsState {
  // Compatibility: Old api arranges maps in array
  if (Array.isArray(state)) state = indexify((state as MapInfo[]).filter((e) => e && e.api_id))
  switch (type) {
    case '@@Response/kcsapi/api_get_member/mapinfo': {
      const newState = indexify(body.api_map_info)
      // The 3rd arg shouldn't be 2, because defeated map has no defeat_count
      // and will remain its value in that case
      return pickExisting(compareUpdate(state, newState, 1), newState)
    }
    case '@@Response/kcsapi/api_req_map/select_eventmap_rank': {
      const id = `${postBody.api_maparea_id}${postBody.api_map_no}`
      return compareUpdate(
        state,
        {
          [id]: {
            api_eventmap: {
              api_selected_rank: parseInt(postBody.api_rank),
              ...mapValues(body.api_maphp, Number),
            },
          },
        },
        3,
      )
    }
    case '@@Response/kcsapi/api_req_map/start': {
      const { api_eventmap } = body
      const id = `${postBody.api_maparea_id}${postBody.api_mapinfo_no}`
      if (api_eventmap) {
        const { api_max_maphp, api_now_maphp } = api_eventmap
        return compareUpdate(
          state,
          {
            [id]: {
              api_eventmap: {
                api_max_maphp,
                api_now_maphp,
              },
            },
          },
          3,
        )
      }
      break
    }
  }
  return state
}
