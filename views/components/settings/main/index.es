import React from 'react'
import { translate } from 'react-i18next'
import { connect } from 'react-redux'
import { get } from 'lodash'

import { NavigatorBar } from './navigator-bar'
import { StorageConfig } from './storage-config'
import { LanguageConfig } from './language-config'
import { ScreenshotConfig } from './screenshot-config'
import { PluginConfig } from './plugin-config'
import { AdvancedConfig } from './advanced-config'

export const PoiConfig = connect(state => ({
  refts: get(state, 'layout.webview.refts', 0),
}))(
  translate(['setting'])(({ refts, t }) => (
    <div>
      <NavigatorBar key={`isolate-game-window: ${refts}`} />
      <LanguageConfig />
      <StorageConfig />
      <ScreenshotConfig />
      <PluginConfig />
      <AdvancedConfig />
    </div>
  )),
)
