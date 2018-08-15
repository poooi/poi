import React from 'react'
import { Grid, Col, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { remote } from 'electron'
import { translate } from 'react-i18next'
import { connect } from 'react-redux'
import { get } from 'lodash'

import { Divider } from '../components/divider'

import { NotificationConfig } from './notification-config'
import { NavigatorBar } from './navigator-bar'
import { ClearDataConfig } from './clear-data-config'
import { LanguageConfig } from './language-config'
import { SlotCheckConfig } from './slot-check-config'
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
    <div className="form-group navigator-bar" id='navigator-bar'>
      <Divider text={t('setting:Browser')} />
      <NavigatorBar key={`isolate-game-window: ${refts}`} />
    </div>
    <div className="form-group">
      <Divider text={t('setting:Notification')} />
      <NotificationConfig />
    </div>
    <div className="form-group" >
      <Divider text={t('setting:Slot Check')} />
      <SlotCheckConfig type="ship" />
      <SlotCheckConfig type="item" />
    </div>
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
        configName="poi.screenshotFormat"
        defaultVal='png'
        availableVal={[{name: 'PNG', value: 'png'}, {name: 'JPEG', value: 'jpg'}]} />
    </div>
    <div className="form-group">
      <Divider text={t('setting:Screenshot Folder')} />
      <FolderPickerConfig
        label={t('setting:Screenshot Folder')}
        configName="poi.screenshotPath"
        defaultVal={remote.getGlobal('DEFAULT_SCREENSHOT_PATH')}
        exclude={screenshotPathExclude}
      />
    </div>
    <div className="form-group">
      <Divider text={t('setting:Cache Folder')} />
      <FolderPickerConfig
        label={t('setting:Cache Folder')}
        configName="poi.cachePath"
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
          <CheckboxLabelConfig
            label={t('setting:Display Final Stage Notification')}
            configName="poi.lastbattle.enabled"
            defaultVal={true} />
          <CheckboxLabelConfig
            label={t('setting:Display Event Ship Locking Notification')}
            configName="poi.eventSortieCheck.enable"
            defaultVal={true} />
        </Col>
      </Grid>
    </div>
    <div className="form-group">
      <Divider text={t('setting:Advanced functionalities')} />
      <Grid>
        <Col xs={12}>
          <CheckboxLabelConfig
            label={t('setting:Disable Hardware Acceleration')}
            configName="poi.disableHA"
            defaultVal={false} />
          <CheckboxLabelConfig
            label={t('setting:Editing DMM Cookie Region Flag')}
            configName="poi.enableDMMcookie"
            defaultVal={false} />
          <CheckboxLabelConfig
            label={t('setting:Prevent DMM Network Change Popup')}
            configName="poi.disableNetworkAlert"
            defaultVal={false} />
          <CheckboxLabelConfig
            label={t('setting:Show network status in notification bar')}
            configName="poi.showNetworkLog"
            defaultVal={true} />
          {
            (process.platform === 'win32') ?
              <CheckboxLabelConfig
                label={t('setting:Create shortcut on startup (Notification may not be working without shortcut)')}
                configName="poi.createShortcut"
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
            configName="poi.enterSafeMode"
            defaultVal={false} />
          <CheckboxLabelConfig
            label={t('setting:Send data to Google Analytics')}
            configName="poi.sendAnalytics"
            defaultVal={true} />
        </Col>
      </Grid>
    </div>
  </div>
)))
