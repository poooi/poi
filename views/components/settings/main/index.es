import React from 'react'
import { Grid, Col, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { translate } from 'react-i18next'
import { connect } from 'react-redux'
import { get } from 'lodash'

import { NotificationConfig } from './notification-config'
import { NavigatorBar } from './navigator-bar'
import { StorageConfig } from './storage-config'
import { LanguageConfig } from './language-config'
import { PreSortieConfig } from './pre-sortie-config'
import { ScreenshotConfig } from './screenshot-config'
import { AdvancedConfig } from './advanced-config'

export const PoiConfig = connect(state => ({
  refts: get(state, 'layout.webview.refts', 0),
}))(translate(['setting'])(({ refts, t }) => (
  <div>
    <NavigatorBar key={`isolate-game-window: ${refts}`} />
    <NotificationConfig />
    <PreSortieConfig />
    <StorageConfig />
    <LanguageConfig />
    <ScreenshotConfig />
    <AdvancedConfig />
  </div>
)))
