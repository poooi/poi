import type { ExtendedWebviewTag } from 'views/components/etc/webview'

import { createSlice } from '@reduxjs/toolkit'
import { config } from 'views/env'
import { getZoomedSize } from 'views/services/utils'

import {
  createLayoutUpdateAction,
  createLayoutWebviewUseFixedResolutionAction,
  createLayoutWebviewWindowUseFixedResolutionAction,
  createLayoutWebviewUpdateWebviewRefAction,
  createLayoutWebviewSizeAction,
} from '../actions/layout'

export interface PaneSize {
  width: number
  height: number
}

export interface WebviewState extends PaneSize {
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
    height: getZoomedSize(config.get('poi.webview.width', 1200)! * 0.6),
    windowWidth: getZoomedSize(config.get('poi.webview.windowWidth', 1200)),
    windowHeight: getZoomedSize(config.get('poi.webview.windowWidth', 1200)! * 0.6),
    useFixedResolution: config.get('poi.webview.useFixedResolution', true)!,
    windowUseFixedResolution: config.get('poi.webview.windowUseFixedResolution', true)!,
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

const layoutSlice = createSlice({
  name: 'layout',
  initialState: initState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createLayoutUpdateAction, (state, { payload }) => {
        return {
          ...state,
          ...getIntegerSize(payload as SizeObject),
          webview: {
            ...state.webview,
            ...getIntegerSize((payload.webview ?? {}) as SizeObject),
          },
        }
      })
      .addCase(createLayoutWebviewUseFixedResolutionAction, (state, { payload }) => {
        return {
          ...state,
          webview: {
            ...state.webview,
            useFixedResolution: payload,
          },
        }
      })
      .addCase(createLayoutWebviewWindowUseFixedResolutionAction, (state, { payload }) => {
        return {
          ...state,
          webview: {
            ...state.webview,
            windowUseFixedResolution: payload,
          },
        }
      })
      .addCase(createLayoutWebviewUpdateWebviewRefAction, (state, { payload }) => {
        return {
          ...state,
          webview: {
            ...state.webview,
            ref: payload.ref,
            refts: payload.ts,
          },
        }
      })
      .addCase(createLayoutWebviewSizeAction, (state, { payload }) => {
        return {
          ...state,
          webview: {
            ...state.webview,
            ...getIntegerSize(payload as SizeObject),
          },
        }
      })
  },
})

export const reducer = layoutSlice.reducer
