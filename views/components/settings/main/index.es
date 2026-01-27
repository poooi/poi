import { get } from 'lodash'
import React from 'react'
import { withNamespaces } from 'react-i18next'
import { connect } from 'react-redux'

import { AccessibilityConfig } from './accessibility-config'
import { AdvancedConfig } from './advanced-config'
import { LanguageConfig } from './language-config'
import { NavigatorBar } from './navigator-bar'
import { PluginConfig } from './plugin-config'
import { ScreenshotConfig } from './screenshot-config'
import { StorageConfig } from './storage-config'

export const PoiConfig = connect((state) => ({
  refts: get(state, 'layout.webview.refts', 0),
}))(
  withNamespaces(['setting'])(({ refts, t }) => (
    <div>
      <NavigatorBar key={`isolate-game-window: ${refts}`} />
      <LanguageConfig />
      <StorageConfig />
      <ScreenshotConfig />
      <PluginConfig />
      <AccessibilityConfig />
      <AdvancedConfig />
    </div>
  )),
)
