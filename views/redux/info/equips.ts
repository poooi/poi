import { compareUpdate, indexify, pickExisting } from 'views/utils/tools'
import { flatMap, isArray, get, keyBy, filter } from 'lodash'

export interface Equip {
  api_id: number
  api_slotitem_id?: number
  api_locked?: number
  [key: string]: unknown
}

export interface EquipsState {
  [key: string]: Equip
}

interface Action {
  type: string
  body?: {
    api_slot_item?: Equip[]
    api_create_flag?: number
    api_get_items?: Equip[]
    api_slotitem?: Equip | Equip[]
    api_locked?: number
    api_use_slot_id?: number[]
    api_remodel_flag?: number
    api_after_slot?: Equip
    [key: string]: unknown
  } & Equip[]
  postBody?: {
    api_slotitem_ids?: string
    api_slotitem_id?: string
    api_slot_dest_flag?: string
    api_id_items?: string
    api_ship_id?: string
    [key: string]: unknown
  }
}

interface Store {
  info?: {
    ships?: {
      [key: string]: {
        api_slot?: number[]
      }
    }
  }
}

// Returns a clone
// Don't worry about -1 because it won't cause error
function removeEquips(equips: EquipsState, idList: (string | number)[]): EquipsState {
  equips = Object.assign({}, equips)
  idList.forEach((itemId) => delete equips[itemId])
  return equips
}

const ensureArray = <T>(x: T | T[]): T[] => (isArray(x) ? x : [x])

export function reducer(
  state: EquipsState = {},
  { type, postBody, body }: Action,
  store?: Store,
): EquipsState {
  switch (type) {
    case '@@Response/kcsapi/api_get_member/slot_item': {
      const bodyEquips = indexify(body)
      return pickExisting(compareUpdate(state, bodyEquips), bodyEquips)
    }
    case '@@Response/kcsapi/api_get_member/require_info': {
      const bodyEquips = indexify(body.api_slot_item)
      return pickExisting(compareUpdate(state, bodyEquips), bodyEquips)
    }
    case '@@Response/kcsapi/api_req_kousyou/createitem':
      if (body.api_create_flag == 1) {
        const items = keyBy(
          filter(body.api_get_items, (item) => item?.api_id > 0),
          'api_id',
        )
        return {
          ...state,
          ...items,
        }
      }
      break
    case '@@Response/kcsapi/api_req_kousyou/getship':
      if (body.api_slotitem) {
        return {
          ...state,
          ...indexify(body.api_slotitem),
        }
      }
      break
    case '@@Response/kcsapi/api_req_kousyou/destroyitem2':
      return removeEquips(state, postBody.api_slotitem_ids.split(','))
    case '@@Response/kcsapi/api_req_kaisou/lock': {
      const { api_slotitem_id } = postBody
      const { api_locked } = body
      return {
        ...state,
        [api_slotitem_id]: {
          ...state[api_slotitem_id],
          api_locked: api_locked,
        },
      }
    }
    case '@@Response/kcsapi/api_req_kaisou/powerup':
      return parseInt(postBody?.api_slot_dest_flag || '0') === 0
        ? state
        : removeEquips(
            state,
            (postBody?.api_id_items || '')
              .split(',')
              .flatMap((shipId) => get(store, `info.ships.${shipId}.api_slot`) || []),
          )
    case '@@Response/kcsapi/api_req_kousyou/destroyship':
      return parseInt(postBody.api_slot_dest_flag) === 0
        ? state
        : removeEquips(
            state,
            flatMap(
              postBody.api_ship_id.split(','),
              (shipId) => get(store, `info.ships.${shipId}.api_slot`) || [],
            ),
          )
    case '@@Response/kcsapi/api_req_kousyou/remodel_slot': {
      const { api_use_slot_id, api_remodel_flag, api_after_slot } = body
      if (api_use_slot_id != null) {
        state = removeEquips(state, api_use_slot_id)
      }
      if (api_remodel_flag == 1 && api_after_slot != null) {
        state = {
          ...state,
          [api_after_slot.api_id]: api_after_slot,
        }
      }
      return state
    }
    case '@@Response/kcsapi/api_req_member/itemuse': {
      if (body.api_slotitem) {
        return {
          ...state,
          ...indexify(ensureArray(body.api_slotitem)),
        }
      }
    }
  }
  return state
}
