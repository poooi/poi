import path from 'path-extra'
import { shell, remote } from 'electron'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { Grid, Col, Row, Checkbox, Radio, Alert, Button, ButtonGroup, Collapse, Well, OverlayTrigger, Tooltip, Panel } from 'react-bootstrap'
import { get, partial } from 'lodash'
import { connect } from 'react-redux'
import FileDrop from 'react-file-dropzone'
import { translate } from 'react-i18next'
import i18next from 'views/env-parts/i18next'

import { CheckboxLabelConfig } from '../components/checkbox'
import PluginManager from 'views/services/plugin-manager'

import { NameInput } from './name-input'
import { InstalledPlugin } from './installed-plugin'
import { UninstalledPlugin } from './uninstalled-plugin'

import '../assets/plugins.css'

const {dialog} = remote.require('electron')
const {PLUGIN_PATH} = window

@translate(['setting'])
@connect((state, props) => ({
  plugins: state.plugins,
  mirrorName: get(state, 'config.packageManager.mirrorName', navigator.language === 'zh-CN' ?  "taobao" : "npm"),
  proxy: get(state, 'config.packageManager.proxy', false),
  betaCheck: get(state, 'config.packageManager.enableBetaPluginCheck', false),
  autoUpdate: get(state, 'config.packageManager.enableAutoUpdate', true),
}))
export class PluginConfig extends Component {
  static propTypes = {
    plugins: PropTypes.array,
    mirrorName: PropTypes.string,
    proxy: PropTypes.bool,
    betaCheck: PropTypes.bool,
    autoUpdate: PropTypes.bool,
  }
  state = {
    checkingUpdate: false,
    npmWorking: false,
    installingAll: false,
    installingPluginNames: [],
    updatingAll: false,
    reloading: false,
    advanced: false,
    manuallyInstallStatus: 0,
  }

  handleEnableBetaPluginCheck = () => {
    PluginManager.selectConfig(null, null, !this.props.betaCheck)
  }
  handleEnableProxy = () => {
    PluginManager.selectConfig(null, !this.props.proxy, null)
  }
  handleEnableAutoUpdate = () => {
    // unlike other options, autoUpdate will not write to npm conf
    window.config.set('packageManager.enableAutoUpdate', !this.props.autoUpdate)
  }
  onSelectServer = (state) => {
    PluginManager.selectConfig(state ,null, null)
  }
  handleAdvancedShow = () => {
    this.setState({advanced: !this.state.advanced})
  }
  handleEnable = async (index) => {
    const plugin = this.props.plugins[index]
    switch (PluginManager.getStatusOfPlugin(plugin)){
    case PluginManager.DISABLED:
      await PluginManager.enablePlugin(plugin)
      break
    case PluginManager.VALID:
      await PluginManager.disablePlugin(plugin)
      break
    }
  }
  handleInstall = async (name, e) => {
    if (get(e, 'target.disabled')) {
      return
    }
    let installingPluginNames = this.state.installingPluginNames.slice()
    installingPluginNames.push(name)
    this.setState({
      installingPluginNames,
      npmWorking: true,
    })
    try {
      await PluginManager.installPlugin(name)
      installingPluginNames = this.state.installingPluginNames.slice()
      const index = installingPluginNames.indexOf(name)
      if (index > -1) {
        installingPluginNames.splice(index, 1)
        this.setState({
          installingPluginNames,
          npmWorking: false,
        })
      }
    } catch (error) {
      this.setState({npmWorking: false})
      throw error
    }
  }
  handleUpdate = async (index, e) => {
    if (get(e, 'target.disabled')) {
      return
    }
    this.setState({npmWorking: true})
    const plugins = PluginManager.getInstalledPlugins()
    const plugin = plugins[index]
    if (plugin.linkedPlugin) {
      this.setState({npmWorking: false})
      return
    }
    try {
      await PluginManager.installPlugin(plugin.packageName, plugin.latestVersion)
    } catch (error) {
      throw error
    } finally {
      this.setState({npmWorking: false})
    }
  }
  handleInstallAll = async () => {
    this.setState({
      installingAll: true,
      npmWorking: true,
    })
    const settings = PluginManager.getUninstalledPluginSettings()
    for (const name in settings) {
      try {
        await this.handleInstall(name)
      } catch (e) {
        console.error(e)
      }
    }
    this.setState({
      installingAll: false,
      npmWorking: false,
    })
  }
  handleUpdateAll = async (e) => {
    if (get(e, 'target.disabled')) {
      return
    }
    this.setState({
      updatingAll: true,
      npmWorking: true,
    })
    const plugins = PluginManager.getInstalledPlugins()
    for (const index in plugins) {
      if (plugins[index].isOutdated) {
        try {
          await this.handleUpdate(index)
        } catch (error) {
          throw error
        }
      }
    }
    this.setState({
      updatingAll: false,
      npmWorking: false,
    })
  }
  handleRemove = async (index, e) => {
    if (get(e, 'target.disabled')) {
      return
    }
    this.setState({npmWorking: true})
    try {
      const plugins = PluginManager.getInstalledPlugins()
      const plugin = plugins[index]
      await PluginManager.uninstallPlugin(plugin)
    }
    catch (error) {
      throw error
    } finally {
      this.setState({npmWorking: false})
    }
  }
  checkUpdate = async () =>{
    this.setState({
      checkingUpdate: true,
      npmWorking: true,
    })
    await PluginManager.getOutdatedPlugins()
    this.setState({
      checkingUpdate: false,
      npmWorking: false,
    })
  }
  onSelectOpenFolder = () => {
    shell.openItem(path.join(PLUGIN_PATH, 'node_modules'))
  }
  onSelectOpenSite = (e) => {
    shell.openExternal("https://www.npmjs.com/search?q=poi-plugin")
    e.preventDefault()
  }
  onSelectInstallFromFile = () => {
    this.synchronize(async () => {
      const filenames = dialog.showOpenDialog({
        title: i18next.t('setting:Select files'),
        defaultPath: remote.require('electron').app.getPath('downloads'),
        properties: ['openFile', 'multiSelections'],
      })
      if (filenames) {
        for (const index in filenames) {
          const filename = filenames[index]
          this.setState({manuallyInstallStatus: 1})
          try {
            await this.handleInstall(filename)
            this.setState({manuallyInstallStatus: 2})
          } catch (error) {
            this.setState({manuallyInstallStatus: 3})
          }
        }
      }
    })
  }
  onDropInstallFromFile = async (droppedFiles) => {
    const filenames = []
    // droppedFiles is not an Array, but a FileList
    for (let i = 0; i < droppedFiles.length; i++) {
      filenames.push(droppedFiles[i].path)
    }
    if (filenames.length > 0) {
      for (const index in filenames) {
        const filename = filenames[index]
        this.setState({manuallyInstallStatus: 1})
        try {
          await this.handleInstall(filename)
          this.setState({manuallyInstallStatus: 2})
        } catch (error) {
          this.setState({manuallyInstallStatus: 3})
        }
      }
    }
  }
  handleManuallyInstall = async (name) => {
    this.setState({manuallyInstallStatus: 1})
    try {
      await this.handleInstall(name)
      this.setState({manuallyInstallStatus: 2})
    } catch (error) {
      this.setState({manuallyInstallStatus: 3})
    }
  }
  handleGracefulRepair = async () => {
    this.setState({
      npmWorking: true,
    })
    try {
      await PluginManager.gracefulRepair()
    } catch (e) {
      console.error(e)
    } finally {
      this.setState({
        npmWorking: false,
      })
    }
  }
  synchronize = (callback) => {
    if (this.lock) {
      return
    }
    this.lock = true
    callback()
    this.lock = false
  }
  componentDidUpdate = (prevProps, prevState) => {
    if (prevState.manuallyInstallStatus > 1 &&
        prevState.manuallyInstallStatus === this.state.manuallyInstallStatus) {
      this.setState({manuallyInstallStatus: 0})
    }
  }
  componentDidMount = async () => {
    this.setState({
      checkingUpdate: true,
      npmWorking: true,
    })
    const isNotif = window.config.get('config.packageManager.enablePluginCheck', true)
      && !this.props.autoUpdate // if we auto update plugins, don't toast notify
    const handleAutoUpdate = async () => {
      await PluginManager.getOutdatedPlugins(isNotif)
      if (this.props.autoUpdate) {
        const plugins = PluginManager.getInstalledPlugins()
        for (const index in plugins) {
          if (plugins[index].isOutdated) {
            try {
              await this.handleUpdate(index)
            } catch (error) {
              throw error
            }
          }
        }
      }
    }
    PluginManager.on('initialized', handleAutoUpdate)
    this.setState({
      checkingUpdate: false,
      npmWorking: false,
    })
  }
  render() {
    const { t } = this.props
    const uninstalledPluginSettings = PluginManager.getUninstalledPluginSettings()
    const mirrors = PluginManager.getMirrors()
    const updateStatusFAname = this.state.updatingAll ? 'spinner' : 'cloud-download'
    const installStatusFAname = this.state.installingAll ? 'spinner' : 'download'
    let installStatusbsStyle, installStatusText
    switch (this.state.manuallyInstallStatus) {
    case 1:
      installStatusbsStyle = 'info'
      installStatusText = <>{t('setting:Installing')}...</>
      break
    case 2:
      installStatusbsStyle = 'success'
      installStatusText = t('setting:Plugins are installed successfully')
      break
    case 3:
      installStatusbsStyle = 'danger'
      installStatusText = t('setting:InstallFailedMsg')
      break
    default:
      installStatusbsStyle = 'warning'
      installStatusText = ''
    }
    const advanceFAname = this.state.advanced ? 'angle-up' : 'angle-down'
    return (
      <form className='contents-wrapper' style={{marginTop: '10px'}}>
        <FileDrop
          className="plugin-dropfile panel"
          onDrop={this.onDropInstallFromFile}
          acceptType="application/gzip, application/x-gzip"
        >
          {t('setting:Drop plugin tarballs here to install')}
        </FileDrop>
        <Grid className='correct-container'>
          <Row className='plugin-rowspace'>
            <Col xs={12}>
              {
                window.isSafeMode &&
                <Panel header={t('setting:Safe Mode')} bsStyle='warning'>
                  <Panel.Body>{t('setting:Poi is running in safe mode, plugins are not enabled automatically')}</Panel.Body>
                </Panel>
              }
              <ButtonGroup bsSize='small' className='plugin-buttongroup'>
                <Button
                  onClick={this.checkUpdate}
                  disabled={this.state.checkingUpdate}
                  className='control-button col-xs-3'
                >
                  <FontAwesome name='refresh' spin={this.state.checkingUpdate} />
                  <span> {t('setting:Check Update')}</span>
                </Button>
                <Button
                  onClick={this.handleUpdateAll}
                  disabled={this.state.npmWorking ||
                          this.state.checkingUpdate ||
                          !PluginManager.getUpdateStatus()
                  }
                  className='control-button col-xs-3'
                >
                  <FontAwesome
                    name={updateStatusFAname}
                    pulse={this.state.updatingAll}
                  />
                  <span> {t('setting:Update all')}</span>
                </Button>
                <Button
                  onClick={this.handleInstallAll}
                  disabled={this.state.npmWorking ||
                          Object.keys(uninstalledPluginSettings).length === 0
                  }
                  className='control-button col-xs-3'
                >
                  <FontAwesome
                    name={installStatusFAname}
                    pulse={this.state.installingAll}
                  />
                  <span> {t('setting:Install all')}</span>
                </Button>
                <Button
                  onClick={this.handleAdvancedShow}
                  className='control-button col-xs-3'
                >
                  <FontAwesome name="gear" />
                  <span> {t('setting:Advanced')}</span>
                  <FontAwesome name={advanceFAname} />
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <Collapse in={this.state.advanced}>
                <Well>
                  <div>
                    <Row>
                      <Col xs={12}>
                        <CheckboxLabelConfig
                          label={t('setting:Switch to Plugin Automatically')}
                          configName="poi.autoswitch.enabled"
                          defaultVal={true}
                        />
                        <CheckboxLabelConfig
                          label={t('setting:Enable autoswitch for main panel')}
                          configName="poi.autoswitch.main"
                          defaultVal={true}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col xs={12}>
                        <Row>
                          <Col xs={12}>
                            <label className='control-label'>
                              {t('setting:Select npm server')}
                            </label>
                          </Col>
                        </Row>
                        <Row>
                          {
                            Object.keys(mirrors).map((server, index) => {
                              return (
                                <OverlayTrigger
                                  placement='top'
                                  key={index}
                                  overlay={
                                    <Tooltip id={`npm-server-${index}`}>
                                      {mirrors[server].menuname}
                                    </Tooltip>
                                  }
                                >
                                  <Col key={index} xs={6} className='select-npm-server'>
                                    <Radio
                                      checked={this.props.mirrorName == server}
                                      onChange={this.onSelectServer.bind(this, server)}
                                    >
                                      {mirrors[server].name}
                                    </Radio>
                                  </Col>
                                </OverlayTrigger>
                              )
                            }, this)
                          }
                        </Row>
                      </Col>
                      <Col xs={12}>
                        <Row>
                          <Col xs={12}>
                            <label className='control-label'>
                              {t('setting:Others')}
                            </label>
                          </Col>
                        </Row>
                        <div>
                          <Checkbox
                            checked={this.props.proxy || false}
                            onChange={this.handleEnableProxy}
                          >
                            {t('setting:Connect to npm server through proxy')}
                          </Checkbox>
                        </div>
                        <div>
                          <Checkbox
                            checked={this.props.autoUpdate || false}
                            onChange={this.handleEnableAutoUpdate}
                          >
                            {t('setting:Automatically update plugins')}
                          </Checkbox>
                        </div>
                        <div>
                          <Checkbox
                            checked={this.props.betaCheck || false}
                            onChange={this.handleEnableBetaPluginCheck}
                          >
                            {t('setting:Developer option check update of beta version')}
                          </Checkbox>
                        </div>
                        <Row>
                          <ButtonGroup className='plugin-buttongroup'>
                            <Button className='col-xs-4' onClick={this.onSelectOpenFolder}>
                              {t('setting:Open plugin folder')}
                            </Button>
                            <Button className='col-xs-4' onClick={this.onSelectOpenSite}>
                              {t('setting:Search for plugins')}
                            </Button>
                            <Button className='col-xs-4' onClick={this.handleGracefulRepair}>
                              {t('setting:Repair plugins')}
                            </Button>
                          </ButtonGroup>
                        </Row>
                      </Col>
                    </Row>
                  </div>
                </Well>
              </Collapse>
            </Col>
          </Row>
          <Row className='plugin-rowspace'>
            <Collapse in={this.state.manuallyInstallStatus > 0}>
              <Col xs={12}>
                <Alert bsStyle={installStatusbsStyle}>
                  {installStatusText}
                </Alert>
              </Col>
            </Collapse>
          </Row>
          <Row className='plugin-rowspace'>
            <Col xs={12}>
              <NameInput
                handleManuallyInstall={this.handleManuallyInstall}
                manuallyInstallStatus={this.state.manuallyInstallStatus}
                npmWorking={this.state.npmWorking}
              />
            </Col>
            <Col xs={12}>
              <div className="plugin-dropfile-static" onClick={this.onSelectInstallFromFile}>
                {t('setting:Drop plugin packages here to install it, or click here to select them')}
              </div>
            </Col>
          </Row>
          {
            this.props.plugins.map((plugin, index) => {
              return (
                <InstalledPlugin
                  key={plugin.id}
                  plugin={plugin}
                  handleUpdate={partial(this.handleUpdate, index)}
                  handleEnable={partial(this.handleEnable, index)}
                  handleRemove={partial(this.handleRemove, index)}
                />
              )
            }, this)
          }
          {
            Object.keys(uninstalledPluginSettings).map((name, index) => {
              const value = uninstalledPluginSettings[name]
              return (
                <UninstalledPlugin
                  key={name}
                  plugin={value}
                  npmWorking={this.state.npmWorking}
                  installing={this.state.installingPluginNames.includes(name)}
                  handleInstall={partial(this.handleInstall, name)}
                />
              )
            }, this)
          }
        </Grid>
      </form>
    )
  }
}
