// Route entry: [fromNode | null (start), toNode]
type MapRouteEntry = [string | null, string]

// Spot entry: [x, y, nodeType]
type MapSpotEntry = [number, number, string]

export interface FcdMapData {
  route: Record<`${number}` | number, MapRouteEntry>
  spots: Record<string, MapSpotEntry>
}

export type FcdMapState = Record<`${number}-${number}`, FcdMapData>
export interface FcdShipAvatarState {
  backs: Record<`${number}` | number, number>
  marginMagics: Record<`${number}` | number, { normal: number; damaged: number }>
}
export interface FcdShipTagState {
  color: string[]
  fleetname: {
    'zh-CN': string[]
    'zh-TW': string[]
    'en-US': string[]
    'ja-JP': string[]
  }
  mapname: string[]
}

export interface FcdState {
  version: Record<string, string>
  map?: FcdMapState
  shipavatar?: FcdShipAvatarState
  shiptag?: FcdShipTagState
}

type FcdValue =
  | {
      data?: FcdMapState
      meta?: { name?: string; version?: string }
      path?: 'map'
    }
  | {
      data?: FcdShipAvatarState
      meta?: { name?: string; version?: string }
      path?: 'shipavatar'
    }
  | {
      data?: FcdShipTagState
      meta?: { name?: string; version?: string }
      path?: 'shiptag'
    }

const initState: FcdState = {
  version: {},
}

export function reducer(
  state = initState,
  { type, value }: { type: string; value?: FcdValue },
): FcdState {
  switch (type) {
    case '@@updateFCD':
      if (value?.data && value.meta) {
        const { name, version } = value.meta
        if (name && version) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          state = Object.assign({}, state, {
            version: { ...state.version, [name]: version },
            [name]: value.data,
          }) as FcdState
        }
      }
      break
    case '@@replaceFCD':
      if (value?.path && value.data) {
        state = Object.assign({}, state, { [value.path]: value.data })
      }
  }
  return state
}
