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

import CheckboxLabel from '../components/checkbox'
import Radio from '../components/radio'
import FolderPicker from '../components/folder-picker'

const { i18n } = window
const __ = i18n.setting.__.bind(i18n.setting)

const screenshotPathExclude = [
  window.ROOT,
]

const PoiConfig = () => (
  <div>
    <div className="form-group navigator-bar" id='navigator-bar'>
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
      <Radio
        label={__('Screenshot Format')}
        configName="poi.screenshotFormat"
        defaultVal='png'
        availableVal={[{name: 'PNG', value: 'png'}, {name: 'JPEG', value: 'jpg'}]} />
    </div>
    <div className="form-group">
      <Divider text={__('Screenshot Folder')} />
      <FolderPicker
        label={__('Screenshot Folder')}
        configName="poi.screenshotPath"
        defaultVal={remote.getGlobal('DEFAULT_SCREENSHOT_PATH')}
        exclude={screenshotPathExclude}
      />
    </div>
    <div className="form-group">
      <Divider text={__('Cache Folder')} />
      <FolderPicker
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
              <CheckboxLabel
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
                  <CheckboxLabel
                    label={__('Confirm before exit')}
                    undecided={true} />
                </div>
              </OverlayTrigger>
          }
          <CheckboxLabel
            label={__('Display "Tips"')}
            configName="poi.doyouknow.enabled"
            defaultVal={true} />
          <CheckboxLabel
            label={__('Display Final Stage Notification')}
            configName="poi.lastbattle.enabled"
            defaultVal={true} />
          <CheckboxLabel
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
          <CheckboxLabel
            label={__('Disable Hardware Acceleration')}
            configName="poi.disableHA"
            defaultVal={false} />
          <CheckboxLabel
            label={__('Editing DMM Cookie\'s Region Flag')}
            configName="poi.enableDMMcookie"
            defaultVal={false} />
          <CheckboxLabel
            label={__('Prevent DMM Network Change Popup')}
            configName="poi.disableNetworkAlert"
            defaultVal={false} />
          <CheckboxLabel
            label={__('Show network status in notification bar')}
            configName="poi.showNetworkLog"
            defaultVal={true} />
          {
            (process.platform === 'win32') ?
              <CheckboxLabel
                label={__('Create shortcut on startup (Notification may not be working without shortcut)')}
                configName="poi.createShortcut"
                defaultVal={true} />
              :
              null
          }
          {
            (process.platform === 'linux') ?
              <CheckboxLabel
                label={__('Display tray icon')}
                configName="poi.linuxTrayIcon"
                defaultVal={true} />
              :
              null
          }
          <CheckboxLabel
            label={__('Enter safe mode on next startup')}
            configName="poi.enterSafeMode"
            defaultVal={false} />
          <CheckboxLabel
            label={__('Send data to Google Analytics')}
            configName="poi.sendAnalytics"
            defaultVal={true} />
        </Col>
      </Grid>
    </div>
  </div>
)

export default PoiConfig
