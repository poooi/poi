import type { RootState } from 'views/redux/reducer-factory'

import { get } from 'lodash-es'
import React from 'react'
import { useSelector } from 'react-redux'

import { AccessibilityConfig } from './accessibility-config'
import { AdvancedConfig } from './advanced-config'
import { LanguageConfig } from './language-config'
import { NavigatorBar } from './navigator-bar'
import { PluginConfig } from './plugin-config'
import { ScreenshotConfig } from './screenshot-config'
import { StorageConfig } from './storage-config'

export const PoiConfig = () => {
  const refts = Number(useSelector((state: RootState) => get(state, 'layout.webview.refts', 0)))
  return (
    <div>
      <NavigatorBar key={`isolate-game-window: ${refts}`} />
      <LanguageConfig />
      <StorageConfig />
      <ScreenshotConfig />
      <PluginConfig />
      <AccessibilityConfig />
      <AdvancedConfig />
    </div>
  )
}
