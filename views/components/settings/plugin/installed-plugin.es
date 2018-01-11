import classnames from 'classnames'
import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { Col, Row, Button, ButtonGroup, Label, Collapse, Well, OverlayTrigger, Tooltip, Panel } from 'react-bootstrap'
import ReactMarkdown from 'react-remarkable'

import CheckboxLabel from '../components/checkbox'
import PluginManager from 'views/services/plugin-manager'

import PluginSettingWrapper from './plugin-setting-wrapper'

const __ = window.i18n.setting.__.bind(window.i18n.setting)

class InstalledPlugin extends PureComponent {
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
    const settingAvailable = plugin.settingsClass || plugin.switchPluginPath || (!plugin.multiWindow && plugin.windowURL)
    const btnGroupClass = classnames('plugin-buttongroup', {
      'btn-xs-12': settingAvailable,
      'btn-xs-8': !settingAvailable,
    })
    const btnClass = classnames('plugin-control-button', {
      'btn-xs-4': settingAvailable,
      'btn-xs-6': !settingAvailable,
    })
    return (
      <Row className='plugin-wrapper'>
        <Col xs={12}>
          <Panel className={panelClass}>
            <Panel.Body>
              <Row>
                <Col xs={12} className='div-row'>
                  <span className='plugin-name'>
                    {plugin.displayName}
                  </span>
                  <div className='author-wrapper'>{'@'}
                    <a className='author-link'
                      href={plugin.link}>
                      {plugin.author}
                    </a>
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
                      settingAvailable?
                        <OverlayTrigger placement='top' overlay={
                          <Tooltip id={`${plugin.id}-set-btn`}>
                            {__('Settings')}
                          </Tooltip>
                        }>
                          <Button
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
                  settingAvailable?
                    <Collapse in={this.state.settingOpen} className='plugin-setting-wrapper'>
                      <Col xs={12}>
                        <Well>
                          {
                            !!plugin.switchPluginPath &&
                            <div>
                              <CheckboxLabel
                                label={__('Enable auto switch')}
                                configName={`poi.autoswitch.${plugin.id}`}
                                defaultVal={true} />
                            </div>
                          }
                          {
                            (!plugin.multiWindow && plugin.windowURL) &&
                            <div>
                              <CheckboxLabel
                                label={__('Keep plugin process running in background (re-enable to apply changes)')}
                                configName={`poi.backgroundProcess.${plugin.id}`}
                                defaultVal={!plugin.realClose} />
                            </div>
                          }
                          {
                            !!plugin.settingsClass &&
                            <div>
                              <PluginSettingWrapper plugin={plugin} />
                            </div>
                          }
                        </Well>
                      </Col>
                    </Collapse>
                    : null
                }
              </Row>
            </Panel.Body>
          </Panel>
        </Col>
      </Row>
    )
  }
}

export default InstalledPlugin
