import type { ExtendedWebviewTag } from 'views/components/etc/webview'

import { createAction } from '@reduxjs/toolkit'

import type { LayoutState, WebviewState } from '../layout'

export const createLayoutUpdateAction = createAction<
  Omit<Partial<LayoutState>, 'webview'> & { webview?: Partial<WebviewState> }
>('@@LayoutUpdate')

export const createLayoutWebviewUseFixedResolutionAction = createAction<boolean>(
  '@@LayoutUpdate/webview/useFixedResolution',
)

export const createLayoutWebviewWindowUseFixedResolutionAction = createAction<boolean>(
  '@@LayoutUpdate/webview/windowUseFixedResolution',
)

export const createLayoutWebviewUpdateWebviewRefAction = createAction<{
  ref: ExtendedWebviewTag | null
  ts: number
}>('@@LayoutUpdate/webview/UpdateWebviewRef')

export const createLayoutWebviewSizeAction = createAction<Partial<WebviewState>>(
  '@@LayoutUpdate/webview/size',
)
