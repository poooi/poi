import path from 'path-extra'
import classnames from 'classnames'
import { shell, remote } from 'electron'
import React from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { Grid, Col, Row, FormControl, ControlLabel, InputGroup, FormGroup, Checkbox, Radio, Alert, Button, ButtonGroup, Label, Collapse, Well, OverlayTrigger, Tooltip, Panel } from 'react-bootstrap'
import { get, partial } from 'lodash'
import { connect } from 'react-redux'
import shallowCompare from 'react-addons-shallow-compare'
import ReactMarkdown from 'react-remarkable'
import FileDrop from 'react-file-dropzone'

import { CheckboxLabelConfig } from './utils'
import PluginManager from 'views/services/plugin-manager'

const __ = window.i18n.setting.__.bind(window.i18n.setting)

const {dialog} = remote.require('electron')
const {PLUGIN_PATH} = window
const {Component} = React

const openLink = (link, e) => {
  shell.openExternal(link)
  e.preventDefault()
}
class PluginSettingWrap extends Component {
  static propTypes = {
    plugin: PropTypes.object,
  }
  shouldComponentUpdate = (nextProps, nextState) => (this.props.plugin.timestamp !== nextProps.plugin.timestamp)
  render() {
    return (React.createElement(this.props.plugin.settingsClass))
  }
}

// class CollapsiblePanel extends Component {
//   static propTypes = {
//     expanded: PropTypes.bool,
//     transitionTime: PropTypes.number,
//     className: PropTypes.string,
//   }
//   constructor(props) {
//     super(props)
//     this.state = {
//       expanded: props.expanded,
//       hide: !props.expanded,
//     }
//   }
//   componentWillReceiveProps = (nextProps) => {
//     let transitionTime = this.props.transitionTime || 400
//     if (this.props.expanded && !nextProps.expanded) {
//       this.setState({expanded: false})
//       delay(() => {this.setState({hide: true})}, transitionTime)
//     }
//     else if (!this.props.expanded && nextProps.expanded) {
//       this.setState({hide: false})
//       defer(() => {this.setState({expanded: true})})
//     }
//   }
//   render() {
//     let className = classnames(this.props.className, {
//       'hidden': this.state.hide,
//     })
//     return (
//       <Panel {...this.props} className={className} />
//     )
//   }
// }

class InstalledPlugin extends Component {
  static propTypes = {
    plugin: PropTypes.object,
    handleUpdate: PropTypes.func,
    handleEnable: PropTypes.func,
    handleRemove: PropTypes.func,
  }
  state = {
    settingOpen: false,
  }
  toggleSettingPop = () => {
    this.setState({settingOpen: !this.state.settingOpen})
  }
  shouldComponentUpdate(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState)
  }
  render() {
    const plugin = this.props.plugin
    const outdatedLabelbsStyle = (!plugin.latestVersion.includes('beta')) ? 'primary' : 'warning'
    const outdatedLabelFAname = classnames({
      'spinner': plugin.isUpdating,
      'cloud-download': !plugin.isUpdating && plugin.isOutdated,
      'check': !plugin.isUpdating && !plugin.isOutdated,
    })
    const outdatedLabelText = plugin.isUpdating ? `${__('Updating')}` :
      (plugin.isOutdated ? `Version ${plugin.latestVersion}` : `${__('Latest')}` )
    let enableBtnText, enableBtnFAname
    switch (PluginManager.getStatusOfPlugin(plugin)) {
    case PluginManager.VALID:
      enableBtnText = `${__('Disable')}`
      enableBtnFAname = 'pause'
      break
    case PluginManager.DISABLED:
      enableBtnText = `${__('Enable')}`
      enableBtnFAname = 'play'
      break
    case PluginManager.NEEDUPDATE:
      enableBtnText = `${__('Outdated')}`
      enableBtnFAname = 'ban'
      break
    case PluginManager.BROKEN:
      enableBtnText = `${__('Error')}`
      enableBtnFAname = 'close'
      break
    default:
      enableBtnText = ''
      enableBtnFAname = ''
    }
    const removeBtnText = plugin.isUninstalling ? `${__('Removing')}` : `${__('Remove')}`
    const removeBtnFAname = plugin.isInstalled ? 'trash' : 'trash-o'
    const panelClass = classnames('plugin-content', {
      'plugin-content-disabled': PluginManager.getStatusOfPlugin(plugin) !== PluginManager.VALID,
    })
    const outdatedLabelClass = classnames('update-label', {
      'hidden': !plugin.isOutdated,
    })
    const btnGroupClass = classnames('plugin-buttongroup', {
      'btn-xs-12': plugin.settingsClass || plugin.switchPluginPath,
      'btn-xs-8': !plugin.settingsClass && !plugin.switchPluginPath,
    })
    const btnClass = classnames('plugin-control-button', {
      'btn-xs-4': plugin.settingsClass || plugin.switchPluginPath,
      'btn-xs-6': !plugin.settingsClass && !plugin.switchPluginPath,
    })
    return (
      <Row className='plugin-wrapper'>
        <Col xs={12}>
          <Panel className={panelClass}>
            <Row>
              <Col xs={12} className='div-row'>
                <span className='plugin-name'>
                  {plugin.displayName}
                </span>
                <div className='author-wrapper'>{'@'}
                  <span className='author-link'
                    onClick={partial(openLink, plugin.link)}>
                    {plugin.author}
                  </span>
                </div>
                <div className='update-wrapper'>
                  <div>
                    <Label bsStyle={outdatedLabelbsStyle}
                           className={outdatedLabelClass}
                           onClick={this.props.handleUpdate}>
                      <FontAwesome name={outdatedLabelFAname}
                                   pulse={plugin.isUpdating}/>
                      {outdatedLabelText}
                    </Label>
                  </div>
                  <div>
                    <span>
                      {plugin.linkedPlugin && <FontAwesome name='link' />}
                    </span>
                    {`Ver. ${plugin.version || '1.0.0'}`}
                  </div>
                </div>
              </Col>
            </Row>
            <Row>
              <Col className='plugin-description' xs={7}>
                <ReactMarkdown source={plugin.description} />
              </Col>
              <Col className='plugin-option' xs={5}>
                <ButtonGroup bsSize='small' className={btnGroupClass}>
                  {
                    (plugin.settingsClass || plugin.switchPluginPath)?
                      <OverlayTrigger placement='top' overlay={
                         <Tooltip id={`${plugin.id}-set-btn`}>
                           {__('Settings')}
                         </Tooltip>
                         }>
                         <Button ref='setting-btn'
                                 bsStyle='primary' bsSize='xs'
                                 onClick={this.toggleSettingPop}
                                 className='plugin-control-button btn-xs-4'>
                           <FontAwesome name='gear' />
                         </Button>
                       </OverlayTrigger>
                    : null
                  }
                  <OverlayTrigger placement='top' overlay={
                    <Tooltip id={`${plugin.id}-enb-btn`}>
                      {enableBtnText}
                    </Tooltip>
                    }>
                    <Button bsStyle='info'
                      disabled={PluginManager.getStatusOfPlugin(plugin) == PluginManager.NEEDUPDATE}
                      onClick={this.props.handleEnable}
                      className={btnClass}>
                      <FontAwesome name={enableBtnFAname}/>
                    </Button>
                  </OverlayTrigger>
                  <OverlayTrigger placement='top' overlay={
                    <Tooltip id={`${plugin.id}-rm-btn`}>
                      {removeBtnText}
                    </Tooltip>
                    }>
                    <Button bsStyle='danger'
                      onClick={this.props.handleRemove}
                      disabled={!plugin.isInstalled}
                      className={btnClass}>
                      <FontAwesome name={removeBtnFAname} />
                    </Button>
                  </OverlayTrigger>
                </ButtonGroup>
              </Col>
            </Row>
            <Row>
              {
                (plugin.settingsClass || plugin.switchPluginPath)?
                  <Collapse in={this.state.settingOpen} className='plugin-setting-wrapper'>
                    <Col xs={12}>
                      <Well>
                        {
                          !!plugin.switchPluginPath &&
                          <div>
                            <CheckboxLabelConfig
                              label={__('Enable auto switch')}
                              configName={`poi.autoswitch.${plugin.id}`}
                              defaultVal={true} />
                          </div>
                        }
                        {
                          !!plugin.settingsClass &&
                          <div>
                            <PluginSettingWrap plugin={plugin} />
                          </div>
                        }
                      </Well>
                    </Col>
                  </Collapse>
                : null
              }
            </Row>
          </Panel>
        </Col>
      </Row>
    )
  }
}

class UninstalledPlugin extends Component {
  static propTypes = {
    plugin: PropTypes.object,
    installing: PropTypes.bool,
    npmWorking: PropTypes.bool,
    handleInstall: PropTypes.func,
  }
  shouldComponentUpdate(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState)
  }
  render() {
    const plugin = this.props.plugin
    const installButtonText = this.props.installing ? `${__('Installing')}` : `${__('Install')}`
    const installButtonFAname = this.props.installing ? 'spinner' : 'download'
    return (
      <Row className='plugin-wrapper'>
        <Col xs={12}>
          <Panel className='plugin-content'>
            <Row>
              <Col xs={12} className='div-row'>
                <span className='plugin-name'>
                  <FontAwesome name={plugin.icon} />
                  {` ${plugin[window.language]}`}
                </span>
                <div className='author-wrapper'>{'@'}
                  <span className='author-link'
                    onClick={partial(openLink, plugin.link)}>
                    {plugin.author}
                  </span>
                </div>
              </Col>
            </Row>
            <Row>
              <Col className='plugin-description' xs={7}>
                <ReactMarkdown source={plugin[`des${window.language}`]} />
              </Col>
              <Col className='plugin-option-install' xs={5}>
                <ButtonGroup bsSize='small' className='plugin-buttongroup btn-xs-4'>
                  <OverlayTrigger placement='top' overlay={
                    <Tooltip id={`${plugin.id}-ins-btn`}>
                      {installButtonText}
                    </Tooltip>
                    }>
                    <Button bsStyle='primary'
                      disabled={this.props.npmWorking}
                      onClick={this.props.handleInstall}
                      className='plugin-control-button btn-xs-12'>
                      <FontAwesome name={installButtonFAname}
                        pulse={this.props.installing}/>
                    </Button>
                  </OverlayTrigger>
                </ButtonGroup>
              </Col>
            </Row>
          </Panel>
        </Col>
      </Row>
    )
  }
}

class InstallByNameInput extends Component {
  static propTypes = {
    handleManuallyInstall: PropTypes.func,
    manuallyInstallStatus: PropTypes.number,
    npmWorking: PropTypes.bool,
  }
  shouldComponentUpdate(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState)
  }
  state = {
    manuallyInstallPackage: '',
  }
  changeInstalledPackage = (e) => {
    this.setState({manuallyInstallPackage: e.target.value})
  }
  validPackageName = () => {
    return get(this.state, 'manuallyInstallPackage.length', 0) > 0 &&
      /^poi-plugin-.*$/.test(this.state.manuallyInstallPackage)
  }
  render() {
    return (
      <FormGroup>
        <ControlLabel>{__('Install directly from npm')}</ControlLabel>
        <InputGroup bsSize='small'>
          <FormControl type="text"
                 value={this.state.manuallyInstallPackage}
                 onChange={this.changeInstalledPackage}
                 label={__('Install directly from npm')}
                 disabled={this.props.manuallyInstallStatus === 1 || this.props.npmWorking}
                 placeholder={__('Input plugin package name...')}>
          </FormControl>
          <InputGroup.Button>
            <Button bsStyle='primary'
                    disabled={this.props.manuallyInstallStatus === 1 ||
                      this.props.npmWorking ||
                      !this.validPackageName()}
                    onClick={this.props.handleManuallyInstall.bind(null, this.state.manuallyInstallPackage)}>
              {__('Install')}
            </Button>
          </InputGroup.Button>
        </InputGroup>
      </FormGroup>
    )
  }
}

const PluginConfig = connect((state, props) => ({
  plugins: state.plugins,
  mirrorName: get(state, 'config.packageManager.mirrorName', navigator.language === 'zh-CN' ?  "taobao" : "npm"),
  proxy: get(state, 'config.packageManager.proxy', false),
  betaCheck: get(state, 'config.packageManager.enableBetaPluginCheck', false),
  autoUpdate: get(state, 'config.packageManager.enableAutoUpdate', false),
}))(class pluginConfig extends Component {
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
  isUpdateAvailable = false
  checkCount = 0
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
  handleEnable = (index) => {
    const plugins = PluginManager.getInstalledPlugins()
    const plugin = plugins[index]
    switch (PluginManager.getStatusOfPlugin(plugin)){
    case PluginManager.DISABLED:
      PluginManager.enablePlugin(plugin)
      break
    case PluginManager.VALID:
      PluginManager.disablePlugin(plugin)
      break
    }
  }
  handleInstall = async (name, e) => {
    if (get(e, 'target.disabled')) {
      return
    }
    let installingPluginNames = this.state.installingPluginNames
    installingPluginNames.push(name)
    this.setState({
      installingPluginNames: installingPluginNames,
      npmWorking: true,
    })
    try {
      await PluginManager.installPlugin(name)
      installingPluginNames = this.state.installingPluginNames
      const index = installingPluginNames.indexOf(name)
      if (index > -1) {
        installingPluginNames.splice(index, 1)
        this.setState({
          installingPluginNames: installingPluginNames,
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
      return
    }
    try {
      await PluginManager.installPlugin(plugin.packageName, plugin.latestVersion)
      this.setState({npmWorking: false})
    } catch (error) {
      this.setState({npmWorking: false})
      throw error
    }
  }
  handleInstallAll = async () => {
    this.setState({
      installingAll: true,
      npmWorking: true,
    })
    const settings = PluginManager.getUninstalledPluginSettings()
    for (const name in settings) {
      await this.handleInstall(name)
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
      this.setState({npmWorking: false})
    }
    catch (error) {
      this.setState({npmWorking: false})
      throw error
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
        title: __('Select files'),
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
    this.setState({
      checkingUpdate: false,
      npmWorking: false,
    })
  }
  render() {
    const uninstalledPluginSettings = PluginManager.getUninstalledPluginSettings()
    const mirrors = PluginManager.getMirrors()
    const updateStatusFAname = this.state.updatingAll ? 'spinner' : 'cloud-download'
    const installStatusFAname = this.state.installingAll ? 'spinner' : 'download'
    let installStatusbsStyle, installStatusText
    switch (this.state.manuallyInstallStatus) {
    case 1:
      installStatusbsStyle = 'info'
      installStatusText = `${__("Installing")}...`
      break
    case 2:
      installStatusbsStyle = 'success'
      installStatusText = `${__("Plugins are installed successfully.")}`
      break
    case 3:
      installStatusbsStyle = 'danger'
      installStatusText = `${__("Install failed. Maybe the selected files are not plugin packages.")}`
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
          {__('Drop plugin tarballs here to install')}
        </FileDrop>
        <Grid className='correct-container'>
          <Row className='plugin-rowspace'>
            <Col xs={12}>
              { window.isSafeMode &&
                <Panel header={__('Safe Mode')} bsStyle='warning'>
                  {__('Poi is running in safe mode, plugins are not enabled automatically.')}
                </Panel>
              }
              <ButtonGroup bsSize='small' className='plugin-buttongroup'>
                <Button onClick={this.checkUpdate}
                        disabled={this.state.checkingUpdate}
                        className='control-button col-xs-3'>
                  <FontAwesome name='refresh' spin={this.state.checkingUpdate} />
                  <span> {__("Check Update")}</span>
                </Button>
                <Button onClick={this.handleUpdateAll}
                        disabled={this.state.npmWorking ||
                          this.state.checkingUpdate ||
                          !PluginManager.getUpdateStatus()}
                        className='control-button col-xs-3'>
                  <FontAwesome name={updateStatusFAname}
                               pulse={this.state.updatingAll}/>
                  <span> {__("Update all")}</span>
                </Button>
                <Button onClick={this.handleInstallAll}
                        disabled={this.state.npmWorking ||
                          Object.keys(uninstalledPluginSettings).length === 0}
                        className='control-button col-xs-3'>
                  <FontAwesome name={installStatusFAname}
                               pulse={this.state.installingAll}/>
                  <span> {__("Install all")}</span>
                </Button>
                <Button onClick={this.handleAdvancedShow}
                        className='control-button col-xs-3'>
                  <FontAwesome name="gear" />
                  <span> {__("Advanced")} </span>
                  <FontAwesome name={advanceFAname} />
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <Well>
                <Row>
                  <Col xs={12}>
                    <CheckboxLabelConfig
                      label={__('Switch to Plugin Automatically')}
                      configName="poi.autoswitch.enabled"
                      defaultVal={true} />
                    <CheckboxLabelConfig
                      label={__('Enable autoswitch for main panel')}
                      configName="poi.autoswitch.main"
                      defaultVal={true} />
                  </Col>
                </Row>
                <Collapse in={this.state.advanced}>
                  <div>
                    <Row>
                      <Col xs={12}>
                        <Row>
                          <Col xs={12}>
                            <label className='control-label'>
                              {__('Select npm server')}
                            </label>
                          </Col>
                        </Row>
                        <Row>
                        {
                          Object.keys(mirrors).map((server, index) => {
                            return (
                              <OverlayTrigger placement='top' key={index} overlay={
                                <Tooltip id={`npm-server-${index}`}>
                                  {mirrors[server].menuname}
                                </Tooltip>
                              }>
                                <Col key={index} xs={6} className='select-npm-server'>
                                  <Radio checked={this.props.mirrorName == server}
                                         onChange={this.onSelectServer.bind(this, server)} >
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
                              {__('Others')}
                            </label>
                          </Col>
                        </Row>
                        <div>
                          <Checkbox checked={this.props.proxy || false}
                                    onChange={this.handleEnableProxy}>
                            {__('Connect to npm server through proxy')}
                          </Checkbox>
                        </div>
                        <div>
                          <Checkbox checked={this.props.autoUpdate || false}
                                    onChange={this.handleEnableAutoUpdate}>
                            {__('Automatically update plugins')}
                          </Checkbox>
                        </div>
                        <div>
                          <Checkbox checked={this.props.betaCheck || false}
                                    onChange={this.handleEnableBetaPluginCheck}>
                            {__('Developer option: check update of beta version')}
                          </Checkbox>
                        </div>
                        <Row>
                          <ButtonGroup className='plugin-buttongroup'>
                            <Button className='col-xs-6' onClick={this.onSelectOpenFolder}>
                              {__('Open plugin folder')}
                            </Button>
                            <Button className='col-xs-6' onClick={this.onSelectOpenSite}>
                              {__('Search for plugins')}
                            </Button>
                          </ButtonGroup>
                        </Row>
                      </Col>
                    </Row>
                  </div>
                </Collapse>
              </Well>
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
              <InstallByNameInput handleManuallyInstall={this.handleManuallyInstall}
                                  manuallyInstallStatus={this.state.manuallyInstallStatus}
                                  npmWorking={this.state.npmWorking} />
            </Col>
            <Col xs={12}>
              <div className="plugin-dropfile-static" onClick={this.onSelectInstallFromFile}>
                {__("Drop plugin packages here to install it, or click here to select them")}
              </div>
            </Col>
          </Row>
          {
            this.props.plugins.map((plugin, index) => {
              return (<InstalledPlugin
                key={plugin.id}
                plugin={plugin}
                handleUpdate={partial(this.handleUpdate, index)}
                handleEnable={partial(this.handleEnable, index)}
                handleRemove={partial(this.handleRemove, index)}
                />)
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
})

export default PluginConfig
