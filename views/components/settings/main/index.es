import React from 'react'
import { Grid, Col, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { remote } from 'electron'
import { Trans } from 'react-i18next'

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

const screenshotPathExclude = [
  window.ROOT,
]

const PoiConfig = () => (
  <div>
    <div className="form-group navigator-bar" id='navigator-bar'>
      <Divider text={<Trans>setting:Browser</Trans>} />
      <NavigatorBar />
    </div>
    <div className="form-group">
      <Divider text={<Trans>setting:Notification</Trans>} />
      <NotificationConfig />
    </div>
    <div className="form-group" >
      <Divider text={<Trans>setting:Slot Check</Trans>} />
      <SlotCheckConfig type="ship" />
      <SlotCheckConfig type="item" />
    </div>
    <div className="form-group">
      <Divider text={<Trans>setting:Cache and cookies</Trans>} />
      <ClearDataConfig />
    </div>
    <div className="form-group">
      <Divider text={<Trans>setting:Language</Trans>} />
      <LanguageConfig />
    </div>
    <div className="form-group">
      <Divider text={<Trans>setting:Screenshot Format</Trans>} />
      <Radio
        label={<Trans>setting:Screenshot Format</Trans>}
        configName="poi.screenshotFormat"
        defaultVal='png'
        availableVal={[{name: 'PNG', value: 'png'}, {name: 'JPEG', value: 'jpg'}]} />
    </div>
    <div className="form-group">
      <Divider text={<Trans>setting:Screenshot Folder</Trans>} />
      <FolderPicker
        label={<Trans>setting:Screenshot Folder</Trans>}
        configName="poi.screenshotPath"
        defaultVal={remote.getGlobal('DEFAULT_SCREENSHOT_PATH')}
        exclude={screenshotPathExclude}
      />
    </div>
    <div className="form-group">
      <Divider text={<Trans>setting:Cache Folder</Trans>} />
      <FolderPicker
        label={<Trans>setting:Cache Folder</Trans>}
        configName="poi.cachePath"
        defaultVal={remote.getGlobal('DEFAULT_CACHE_PATH')} />
    </div>
    <div className="form-group">
      <Divider text={<Trans>setting:Other settings</Trans>} />
      <Grid>
        <Col xs={12}>
          {
            (process.platform !== 'darwin') ?
              <ShortcutConfig
                label={<Trans>setting:Boss key</Trans>}
                configName="poi.shortcut.bosskey" />
              :
              <ShortcutConfig
                label={<Trans>setting:Boss key</Trans>}
                defaultVal="Cmd+H"
                active={false} />
          }
          {
            (process.platform !== 'darwin') ?
              <CheckboxLabel
                label={<Trans>setting:Confirm before exit</Trans>}
                configName="poi.confirm.quit"
                defaultVal={false} />
              :
              <OverlayTrigger placement="top"
                overlay={
                  <Tooltip id="tooltip-confirm-before-exit">
                    {<Trans>setting:Set this in the OS X App Menu</Trans>}
                  </Tooltip>} >
                <div>
                  <CheckboxLabel
                    label={<Trans>setting:Confirm before exit</Trans>}
                    undecided={true} />
                </div>
              </OverlayTrigger>
          }
          <CheckboxLabel
            label={<Trans>setting:Display Final Stage Notification</Trans>}
            configName="poi.lastbattle.enabled"
            defaultVal={true} />
          <CheckboxLabel
            label={<Trans>setting:Display Event Ship Locking Notification</Trans>}
            configName="poi.eventSortieCheck.enable"
            defaultVal={true} />
        </Col>
      </Grid>
    </div>
    <div className="form-group">
      <Divider text={<Trans>setting:Advanced functionalities</Trans>} />
      <Grid>
        <Col xs={12}>
          <CheckboxLabel
            label={<Trans>setting:Disable Hardware Acceleration</Trans>}
            configName="poi.disableHA"
            defaultVal={false} />
          <CheckboxLabel
            label={<Trans>setting:Editing DMM Cookie Region Flag</Trans>}
            configName="poi.enableDMMcookie"
            defaultVal={false} />
          <CheckboxLabel
            label={<Trans>setting:Prevent DMM Network Change Popup</Trans>}
            configName="poi.disableNetworkAlert"
            defaultVal={false} />
          <CheckboxLabel
            label={<Trans>setting:Show network status in notification bar</Trans>}
            configName="poi.showNetworkLog"
            defaultVal={true} />
          {
            (process.platform === 'win32') ?
              <CheckboxLabel
                label={<Trans>setting:Create shortcut on startup (Notification may not be working without shortcut)</Trans>}
                configName="poi.createShortcut"
                defaultVal={true} />
              :
              null
          }
          {
            (process.platform === 'linux') ?
              <CheckboxLabel
                label={<Trans>setting:Display tray icon</Trans>}
                configName="poi.linuxTrayIcon"
                defaultVal={true} />
              :
              null
          }
          <CheckboxLabel
            label={<Trans>setting:Enter safe mode on next startup</Trans>}
            configName="poi.enterSafeMode"
            defaultVal={false} />
          <CheckboxLabel
            label={<Trans>setting:Send data to Google Analytics</Trans>}
            configName="poi.sendAnalytics"
            defaultVal={true} />
        </Col>
      </Grid>
    </div>
  </div>
)

export default PoiConfig
