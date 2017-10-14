import React from 'react'
import { Grid, Col, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { remote } from 'electron'
import Divider from '../components/divider'

import NotificationConfig from './notification-config'
import NavigatorBar from './navigator-bar'
import ClearDataConfig from './clear-data-config'
import LanguageConfig from './language-config'
import SlotCheckConfig from './slot-check-config'
import ShortcutConfig from './shortcut-config'

import { CheckboxLabelConfig, RadioConfig, FolderPickerConfig } from '../parts/utils'

const { i18n } = window
const __ = i18n.setting.__.bind(i18n.setting)

const PoiConfig = () => (
  <div>
    <div className="form-group" id='navigator-bar'>
      <Divider text={__('Browser')} />
      <NavigatorBar />
    </div>
    <div className="form-group">
      <Divider text={__('Notification')} />
      <NotificationConfig />
    </div>
    <div className="form-group" >
      <Divider text={__('Slot Check')} />
      <SlotCheckConfig type="ship" />
      <SlotCheckConfig type="item" />
    </div>
    <div className="form-group">
      <Divider text={__('Cache and cookies')} />
      <ClearDataConfig />
    </div>
    <div className="form-group">
      <Divider text={__('Language')} />
      <LanguageConfig />
    </div>
    <div className="form-group">
      <Divider text={__('Screenshot Format')} />
      <RadioConfig
        label={__('Screenshot Format')}
        configName="poi.screenshotFormat"
        defaultVal='png'
        availableVal={[{name: 'PNG', value: 'png'}, {name: 'JPEG', value: 'jpg'}]} />
    </div>
    <div className="form-group">
      <Divider text={__('Screenshot Folder')} />
      <FolderPickerConfig
        label={__('Screenshot Folder')}
        configName="poi.screenshotPath"
        defaultVal={window.screenshotPath} />
    </div>
    <div className="form-group">
      <Divider text={__('Cache Folder')} />
      <FolderPickerConfig
        label={__('Cache Folder')}
        configName="poi.cachePath"
        defaultVal={remote.getGlobal('DEFAULT_CACHE_PATH')} />
    </div>
    <div className="form-group">
      <Divider text={__('Other settings')} />
      <Grid>
        <Col xs={12}>
          {
            (process.platform !== 'darwin') ?
              <ShortcutConfig
                label={__('Boss key')}
                configName="poi.shortcut.bosskey" />
              :
              <ShortcutConfig
                label={__('Boss key')}
                defaultVal="Cmd+H"
                active={false} />
          }
          {
            (process.platform !== 'darwin') ?
              <CheckboxLabelConfig
                label={__('Confirm before exit')}
                configName="poi.confirm.quit"
                defaultVal={false} />
              :
              <OverlayTrigger placement="top"
                overlay={
                  <Tooltip id="tooltip-confirm-before-exit">
                    {__('Set this in the OS X App Menu')}
                  </Tooltip>} >
                <div>
                  <CheckboxLabelConfig
                    label={__('Confirm before exit')}
                    undecided={true} />
                </div>
              </OverlayTrigger>
          }
          <CheckboxLabelConfig
            label={__('Display "Tips"')}
            configName="poi.doyouknow.enabled"
            defaultVal={true} />
          <CheckboxLabelConfig
            label={__('Display Final Stage Notification')}
            configName="poi.lastbattle.enabled"
            defaultVal={true} />
          <CheckboxLabelConfig
            label={__('Display Event Ship Locking Notification')}
            configName="poi.eventSortieCheck.enable"
            defaultVal={true} />
        </Col>
      </Grid>
    </div>
    <div className="form-group">
      <Divider text={__('Advanced functionalities')} />
      <Grid>
        <Col xs={12}>
          <CheckboxLabelConfig
            label={__('Disable Hardware Acceleration')}
            configName="poi.disableHA"
            defaultVal={false} />
          <CheckboxLabelConfig
            label={__('Editing DMM Cookie\'s Region Flag')}
            configName="poi.enableDMMcookie"
            defaultVal={false} />
          <CheckboxLabelConfig
            label={__('Prevent DMM Network Change Popup')}
            configName="poi.disableNetworkAlert"
            defaultVal={false} />
          <CheckboxLabelConfig
            label={__('Show network status in notification bar')}
            configName="poi.showNetworkLog"
            defaultVal={true} />
          {
            (process.platform === 'win32') ?
              <CheckboxLabelConfig
                label={__('Create shortcut on startup (Notification may not be working without shortcut)')}
                configName="poi.createShortcut"
                defaultVal={true} />
              :
              null
          }
          {
            (process.platform === 'linux') ?
              <CheckboxLabelConfig
                label={__('Display tray icon')}
                configName="poi.linuxTrayIcon"
                defaultVal={true} />
              :
              null
          }
          <CheckboxLabelConfig
            label={__('Enter safe mode on next startup')}
            configName="poi.enterSafeMode"
            defaultVal={false} />
          <CheckboxLabelConfig
            label={__('Send data to Google Analytics')}
            configName="poi.sendAnalytics"
            defaultVal={true} />
        </Col>
      </Grid>
    </div>
  </div>
)

export default PoiConfig
