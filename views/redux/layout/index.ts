import type { ExtendedWebviewTag } from 'views/components/etc/webview'

import { config } from 'views/env-parts/config'
import { getZoomedSize } from 'views/services/utils'

interface PaneSize {
  width: number
  height: number
}

interface WebviewState extends PaneSize {
  windowWidth: number
  windowHeight: number
  useFixedResolution: boolean
  windowUseFixedResolution: boolean
  ref: ExtendedWebviewTag | null
  refts: number
}

export interface LayoutState {
  window: PaneSize
  webview: WebviewState
  minishippane: PaneSize
  shippane: PaneSize
  mainpane: PaneSize
  combinedpane: PaneSize
}

const initState: LayoutState = {
  window: {
    width: window.innerWidth,
    height: window.innerHeight,
  },
  webview: {
    width: getZoomedSize(config.get('poi.webview.width', 1200)),
    height: getZoomedSize(config.get('poi.webview.width', 1200) * 0.6),
    windowWidth: getZoomedSize(config.get('poi.webview.windowWidth', 1200)),
    windowHeight: getZoomedSize(config.get('poi.webview.windowWidth', 1200) * 0.6),
    useFixedResolution: config.get('poi.webview.useFixedResolution', true),
    windowUseFixedResolution: config.get('poi.webview.windowUseFixedResolution', true),
    ref: null,
    refts: 0,
  },
  minishippane: {
    width: 250,
    height: 250,
  },
  shippane: {
    width: 450,
    height: 433,
  },
  mainpane: {
    width: 450,
    height: 433,
  },
  combinedpane: {
    width: 250,
    height: 135,
  },
}

type SizeObject = Record<string, number | unknown>

function getIntegerSize<T extends SizeObject>(obj: T): T {
  const result = { ...obj }
  for (const key of Object.keys(result)) {
    const val = result[key]
    if (
      (key.toLowerCase().includes('width') || key.toLowerCase().includes('height')) &&
      typeof val === 'number'
    ) {
      // @ts-expect-error force type assertion
      result[key] = Math.round(val)
    }
  }
  return result
}

type LayoutAction =
  | { type: '@@LayoutUpdate'; value: Partial<LayoutState> & { webview?: Partial<WebviewState> } }
  | { type: '@@LayoutUpdate/webview/useFixedResolution'; value: boolean }
  | { type: '@@LayoutUpdate/webview/windowUseFixedResolution'; value: boolean }
  | {
      type: '@@LayoutUpdate/webview/UpdateWebviewRef'
      value: { ref: ExtendedWebviewTag | null; ts: number }
    }
  | { type: '@@LayoutUpdate/webview/size'; value: Partial<WebviewState> }

export function reducer(state = initState, action: LayoutAction): LayoutState {
  switch (action.type) {
    case '@@LayoutUpdate':
      return {
        ...state,
        ...getIntegerSize(action.value),
        webview: {
          ...state.webview,
          ...getIntegerSize(action.value.webview ?? {}),
        },
      }
    case '@@LayoutUpdate/webview/useFixedResolution':
      return {
        ...state,
        webview: {
          ...state.webview,
          useFixedResolution: action.value,
        },
      }
    case '@@LayoutUpdate/webview/windowUseFixedResolution':
      return {
        ...state,
        webview: {
          ...state.webview,
          windowUseFixedResolution: action.value,
        },
      }
    case '@@LayoutUpdate/webview/UpdateWebviewRef':
      return {
        ...state,
        webview: {
          ...state.webview,
          ref: action.value.ref,
          refts: action.value.ts,
        },
      }
    case '@@LayoutUpdate/webview/size':
      return {
        ...state,
        webview: {
          ...state.webview,
          ...getIntegerSize(action.value),
        },
      }
    default:
      return state
  }
}
