import path from 'path-extra'
import classnames from 'classnames'
import { shell, remote } from 'electron'
import React from 'react'
import FontAwesome from 'react-fontawesome'
import { Grid, Col, Row, Input, Alert, Button, ButtonGroup, Label, Collapse, Well, OverlayTrigger, Tooltip, Panel } from 'react-bootstrap'
import { get, partial } from 'lodash'
import { connect } from 'react-redux'

import PluginManager from '../../../services/plugin-manager'
import Divider from './divider'

const __ = window.i18n.setting.__.bind(window.i18n.setting)

const {dialog} = remote.require('electron')
const {config, PLUGIN_PATH} = window
const {Component} = React

const openLink = (link, e) => {
  shell.openExternal(link)
  e.preventDefault()
}
const confGet = (target, path, value) =>
  ((typeof get(target, path) === "undefined") ? value : get(target, path))
const getPluginIndexByPackageName = (plugins, packageName) => {
  for (let i = 0; i < plugins.length; i++) {
    if (plugins[i].packageName === packageName) {
      return i
    }
  }
  return -1
}

class PluginSettingWrap extends Component {
  static propTypes = {
    plugin: React.PropTypes.object,
  }
  shouldComponentUpdate = (nextProps, nextState) => (false)
  render() {
    return (React.createElement(this.props.plugin.settingsClass))
  }
}

// class CollapsiblePanel extends Component {
//   static propTypes = {
//     expanded: React.PropTypes.bool,
//     transitionTime: React.PropTypes.number,
//     className: React.PropTypes.string,
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

const InstalledPlugin = connect((state, props) => ({
  plugin: state.plugins[getPluginIndexByPackageName(state.plugins, props.plugin)],
  handleUpdate: props.handleUpdate,
  handleEnable: props.handleEnable,
  handleRemove: props.handleRemove,
}))(class installedPlugin extends Component {
  static propTypes = {
    plugin: React.PropTypes.object,
    handleUpdate: React.PropTypes.func,
    handleEnable: React.PropTypes.func,
    handleRemove: React.PropTypes.func,
  }
  state = {
    settingOpen: false,
  }
  toggleSettingPop = () => {
    this.setState({settingOpen: !this.state.settingOpen})
  }
  render() {
    const plugin = this.props.plugin
    const outdatedLabelbsStyle = (plugin.lastestVersion.indexOf('beta') === -1) ? 'primary' : 'warning'
    const outdatedLabelFAname = classnames({
      'spinner': plugin.isUpdating,
      'cloud-download': !plugin.isUpdating && plugin.isOutdated,
      'check': !plugin.isUpdating && !plugin.isOutdated,
    })
    const outdatedLabelText = plugin.isUpdating ? `${__('Updating')}` :
      (plugin.isOutdated ? `Version ${plugin.lastestVersion}` : `${__('Latest')}` )
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
      'btn-xs-12': plugin.settingsClass,
      'btn-xs-8': !plugin.settingsClass,
    })
    const btnClass = classnames('plugin-control-button', {
      'btn-xs-4': plugin.settingsClass,
      'btn-xs-6': !plugin.settingsClass,
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
                    {`Ver. ${plugin.version || '1.0.0'}`}
                  </div>
                </div>
              </Col>
            </Row>
            <Row>
              <Col className='plugin-description' xs={7}>{plugin.description}</Col>
              <Col className='plugin-option' xs={5}>
                <ButtonGroup bsSize='small' className={btnGroupClass}>
                  {
                    (plugin.settingsClass)?
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
                (plugin.settingsClass)?
                  <Collapse in={this.state.settingOpen} className='plugin-setting-wrapper'>
                    <Col xs={12}>
                      <Well>
                        <PluginSettingWrap plugin={plugin} />
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
})

class UninstalledPlugin extends Component {
  static propTypes = {
    plugin: React.PropTypes.object,
    installing: React.PropTypes.bool,
    npmWorking: React.PropTypes.bool,
    handleInstall: React.PropTypes.func,
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
                  {` ${plugin[config.get('poi.language', 'en-US')]}`}
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
              <Col className='plugin-description' xs={7}>{plugin[`des${config.get('poi.language', 'en-US')}`]}</Col>
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
    handleManuallyInstall: React.PropTypes.func,
    manuallyInstallStatus: React.PropTypes.number,
    npmWorking: React.PropTypes.bool,
  }
  state = {
    manuallyInstallPackage: '',
  }
  changeInstalledPackage = (e) => {
    this.setState({manuallyInstallPackage: e.target.value})
  }
  render() {
    return (
      <Input type="text"
             value={this.state.manuallyInstallPackage}
             onChange={this.changeInstalledPackage}
             label={__('Install directly from npm')}
             disabled={this.props.manuallyInstallStatus === 1 || this.props.npmWorking}
             placeholder={__('Input plugin package name...')}
             bsSize='small'
             buttonAfter={
               <Button bsStyle='primary'
                       disabled={this.props.manuallyInstallStatus === 1 || this.props.npmWorking}
                       onClick={this.props.handleManuallyInstall.bind(null, this.state.manuallyInstallPackage)}>
                 {__('Install')}
               </Button>
             }>
      </Input>
    )
  }
}

const PluginConfig = connect((state, props) => ({
  plugins: state.plugins.map((plugin) => (plugin.packageName)),
  mirrorName: confGet(state, 'config.packageManager.mirrorName', navigator.language === 'zh-CN' ?  "taobao" : "npm"),
  proxy: confGet(state, 'config.packageManager.proxy', false),
  betaCheck: confGet(state, 'config.packageManager.enableBetaPluginCheck', false),
}))(class pluginConfig extends Component {
  static propTypes = {
    plugins: React.PropTypes.array,
    mirrorName: React.PropTypes.string,
    proxy: React.PropTypes.bool,
    betaCheck: React.PropTypes.bool,
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
    this.setState({installingPluginNames: installingPluginNames, npmWorking: true})
    try {
      await PluginManager.installPlugin(name)
      installingPluginNames = this.state.installingPluginNames
      const index = installingPluginNames.indexOf(name)
      if (index > -1) {
        installingPluginNames.splice(index, 1)
        this.setState({installingPluginNames: installingPluginNames})
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
    try {
      await PluginManager.updatePlugin(plugin)
      this.setState({npmWorking: false})
    } catch (error) {
      this.setState({npmWorking: false})
      throw error
    }
  }
  handleInstallAll = async () => {
    this.setState({installingAll: true})
    const settings = PluginManager.getUninstalledPluginSettings()
    for (name in settings) {
      await this.handleInstall(name)
    }
    this.setState({installingAll: false})
  }
  handleUpdateAll = async (e) => {
    if (get(e, 'target.disabled')) {
      return
    }
    this.setState({updatingAll: true})
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
    this.setState({checkingUpdate: true})
    await PluginManager.getOutdatedPlugins()
    this.setState({
      checkingUpdate: false,
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
  onDropInstallFromFile = async (e) => {
    e.preventDefault()
    const droppedFiles = e.dataTransfer.files
    const filenames = []
    for (const i in droppedFiles) {
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
    })
    await PluginManager.getOutdatedPlugins(window.config.get('packageManager.enablePluginCheck', true))
    this.setState({
      checkingUpdate: false,
    })
  }
  render() {
    const uninstalledPluginSettings = PluginManager.getUninstalledPluginSettings()
    const mirrors = PluginManager.getMirrors()
    let updateStatusFAname = this.state.updatingAll ? 'spinner' : 'cloud-download'
    let installStatusFAname = this.state.installingAll ? 'spinner' : 'download'
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
    let advanceFAname = this.state.advanced ? 'angle-up' : 'angle-down'
    return (
      <form className='contents-wrapper'>
        <Grid className='correct-container'>
          <Row>
            <Divider text={__('Plugins')} />
          </Row>
          <Row className='plugin-rowspace'>
            <Col xs={12}>
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
                        disabled={this.state.npmWorking}
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
              <Collapse in={this.state.advanced}>
                <div>
                  <Well>
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
                                  <Input type='radio'
                                         label={mirrors[server].name}
                                         checked={this.props.mirrorName == server}
                                         onChange={this.onSelectServer.bind(this, server)} />
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
                          <Input type="checkbox" label={__('Connect to npm server through proxy')}
                                 checked={this.props.proxy || false}
                                 onChange={this.handleEnableProxy} />
                        </div>
                        <div>
                          <Input type="checkbox" label={__('Developer option: check update of beta version')}
                                 checked={this.props.betaCheck || false}
                                 onChange={this.handleEnableBetaPluginCheck} />
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
                  </Well>
                </div>
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
              <InstallByNameInput handleManuallyInstall={this.handleManuallyInstall}
                                  manuallyInstallStatus={this.state.manuallyInstallStatus}
                                  npmWorking={this.state.npmWorking} />
            </Col>
            <Col xs={12}>
              <div className="folder-picker"
                   onClick={this.onSelectInstallFromFile}
                   onDrop={this.onDropInstallFromFile}
                   onDragEnter={(e)=> e.preventDefault()}
                   onDragOver={(e)=> e.preventDefault()}
                   onDragLeave={(e)=> e.preventDefault()}>
                {__("Drop plugin packages here to install it, or click here to select them")}
              </div>
            </Col>
          </Row>
          {
            this.props.plugins.map((plugin, index) => {
              return (<InstalledPlugin
                key={plugin}
                plugin={plugin}
                handleUpdate={partial(this.handleUpdate, index)}
                handleEnable={partial(this.handleEnable, index)}
                handleRemove={partial(this.handleRemove, index)}
                />)
            }, this)
          }
          {
            Object.keys(uninstalledPluginSettings).map((name, index) => {
              let value = uninstalledPluginSettings[name]
              return (
                <UninstalledPlugin
                  key={name}
                  plugin={value}
                  npmWorking={this.state.npmWorking}
                  installing={this.state.installingPluginNames.indexOf(name) !== -1}
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
