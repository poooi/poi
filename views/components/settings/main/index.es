import React from 'react'
import { Grid, Col, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { remote } from 'electron'
import { translate } from 'react-i18next'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { compose } from 'redux'

import { Divider } from '../components/divider'
import { Section } from '../components/section'

import { NotificationConfig } from './notification-config'
import { NavigatorBar } from './navigator-bar'
import { ClearDataConfig } from './clear-data-config'
import { LanguageConfig } from './language-config'
import { PreSortieConfig } from './pre-sortie-config'
import { ShortcutConfig } from './shortcut-config'

import { CheckboxLabelConfig } from '../components/checkbox'
import { RadioConfig } from '../components/radio'
import { FolderPickerConfig } from '../components/folder-picker'

const screenshotPathExclude = [
  window.ROOT,
]

export const PoiConfig = connect(state => ({
  refts: get(state, 'layout.webview.refts', 0),
}))(translate(['setting'])(({ refts, t }) => (
  <div>
    <NavigatorBar key={`isolate-game-window: ${refts}`} />
    <NotificationConfig />
    <PreSortieConfig />
    <div className="form-group">
      <Divider text={t('setting:Cache and cookies')} />
      <ClearDataConfig />
    </div>
    <div className="form-group">
      <Divider text={t('setting:Language')} />
      <LanguageConfig />
    </div>
    <div className="form-group">
      <Divider text={t('setting:Screenshot Format')} />
      <RadioConfig
        label={t('setting:Screenshot Format')}
        configName="poi.misc.screenshot.format"
        defaultVal="png"
        availableVal={[{name: 'PNG', value: 'png'}, {name: 'JPEG', value: 'jpg'}]} />
    </div>
    <div className="form-group">
      <Divider text={t('setting:Screenshot Folder')} />
      <FolderPickerConfig
        label={t('setting:Screenshot Folder')}
        configName="poi.misc.screenshot.path"
        defaultVal={remote.getGlobal('DEFAULT_SCREENSHOT_PATH')}
        exclude={screenshotPathExclude}
      />
    </div>
    <div className="form-group">
      <Divider text={t('setting:Cache Folder')} />
      <FolderPickerConfig
        label={t('setting:Cache Folder')}
        configName="poi.misc.cache.path"
        defaultVal={remote.getGlobal('DEFAULT_CACHE_PATH')} />
    </div>
    <div className="form-group">
      <Divider text={t('setting:Other settings')} />
      <Grid>
        <Col xs={12}>
          {
            (process.platform !== 'darwin') ?
              <ShortcutConfig
                label={t('setting:Boss key')}
                configName="poi.shortcut.bosskey" />
              :
              <ShortcutConfig
                label={t('setting:Boss key')}
                defaultVal="Cmd+H"
                active={false} />
          }
          {
            (process.platform !== 'darwin') ?
              <CheckboxLabelConfig
                label={t('setting:Confirm before exit')}
                configName="poi.confirm.quit"
                defaultVal={false} />
              :
              <OverlayTrigger placement="top"
                overlay={
                  <Tooltip id="tooltip-confirm-before-exit">
                    {t('setting:Set this in the OS X App Menu')}
                  </Tooltip>} >
                <div>
                  <CheckboxLabelConfig
                    label={t('setting:Confirm before exit')}
                    undecided={true} />
                </div>
              </OverlayTrigger>
          }
        </Col>
      </Grid>
    </div>
    <div className="form-group">
      <Divider text={t('setting:Advanced functionalities')} />
      <Grid>
        <Col xs={12}>
          <CheckboxLabelConfig
            label={t('setting:Disable Hardware Acceleration')}
            configName="poi.misc.disablehwaccel"
            defaultVal={false} />
          <CheckboxLabelConfig
            label={t('setting:Editing DMM Cookie Region Flag')}
            configName="poi.misc.dmmcookie"
            defaultVal={false} />
          <CheckboxLabelConfig
            label={t('setting:Prevent DMM Network Change Popup')}
            configName="poi.misc.disablenetworkalert"
            defaultVal={false} />
          <CheckboxLabelConfig
            label={t('setting:Show network status in notification bar')}
            configName="poi.misc.networklog"
            defaultVal={true} />
          {
            (process.platform === 'win32') ?
              <CheckboxLabelConfig
                label={t('setting:Create shortcut on startup (Notification may not be working without shortcut)')}
                configName="poi.misc.shortcut"
                defaultVal={true} />
              :
              null
          }
          {
            (process.platform === 'linux') ?
              <CheckboxLabelConfig
                label={t('setting:Display tray icon')}
                configName="poi.linuxTrayIcon"
                defaultVal={true} />
              :
              null
          }
          <CheckboxLabelConfig
            label={t('setting:Enter safe mode on next startup')}
            configName="poi.misc.safemode"
            defaultVal={false} />
          <CheckboxLabelConfig
            label={t('setting:Send data to Google Analytics')}
            configName="poi.misc.analytics"
            defaultVal={true} />
        </Col>
      </Grid>
    </div>
  </div>
)))
