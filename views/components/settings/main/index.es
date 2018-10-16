import React from 'react'
import { Grid, Col, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { translate } from 'react-i18next'
import { connect } from 'react-redux'
import { get } from 'lodash'

import { Divider } from '../components/divider'

import { NotificationConfig } from './notification-config'
import { NavigatorBar } from './navigator-bar'
import { StorageConfig } from './storage-config'
import { LanguageConfig } from './language-config'
import { PreSortieConfig } from './pre-sortie-config'
import { ScreenshotConfig } from './screenshot-config'
import { SystemConfig } from './system-config'

import { CheckboxLabelConfig } from '../components/checkbox'

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
    <SystemConfig />
    <div className="form-group">
      <Divider text={t('setting:Advanced functionalities')} />
      <Grid>
        <Col xs={12}>
          <CheckboxLabelConfig
            label={t('setting:Disable Hardware Acceleration')}
            configName="poi.misc.disablehwaccel"
            defaultValue={false} />
          <CheckboxLabelConfig
            label={t('setting:Editing DMM Cookie Region Flag')}
            configName="poi.misc.dmmcookie"
            defaultValue={false} />
          <CheckboxLabelConfig
            label={t('setting:Prevent DMM Network Change Popup')}
            configName="poi.misc.disablenetworkalert"
            defaultValue={false} />
          <CheckboxLabelConfig
            label={t('setting:Show network status in notification bar')}
            configName="poi.misc.networklog"
            defaultValue={true} />
          {
            (process.platform === 'win32') ?
              <CheckboxLabelConfig
                label={t('setting:Create shortcut on startup (Notification may not be working without shortcut)')}
                configName="poi.misc.shortcut"
                defaultValue={true} />
              :
              null
          }
          {
            (process.platform === 'linux') ?
              <CheckboxLabelConfig
                label={t('setting:Display tray icon')}
                configName="poi.linuxTrayIcon"
                defaultValue={true} />
              :
              null
          }
          <CheckboxLabelConfig
            label={t('setting:Enter safe mode on next startup')}
            configName="poi.misc.safemode"
            defaultValue={false} />
          <CheckboxLabelConfig
            label={t('setting:Send data to Google Analytics')}
            configName="poi.misc.analytics"
            defaultValue={true} />
        </Col>
      </Grid>
    </div>
  </div>
)))
