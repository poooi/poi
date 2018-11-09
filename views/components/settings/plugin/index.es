/* global PLUGIN_PATH */
import path from 'path-extra'
import { shell } from 'electron'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { get, memoize } from 'lodash'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import Promise from 'bluebird'
import {
  Card,
  Callout,
  Intent,
  Button,
  ButtonGroup,
  Popover,
  Menu,
  Position,
  MenuItem,
} from '@blueprintjs/core'
import styled from 'styled-components'

import PluginManager from 'views/services/plugin-manager'

import { NameInput } from './name-input'
import { PluginItem } from './plugin-item'

const Control = styled.div`
  margin: 1em 0;
`

const AdvancePopover = styled(Popover)`
  flex: 1 1 auto;
`

const SettingButton = styled(Button)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const AdvanceButton = styled(SettingButton)`
  width: 100%;
`

@translate(['setting'])
@connect((state, props) => ({
  plugins: state.plugins,
  mirrorName: get(
    state,
    'config.packageManager.mirrorName',
    navigator.language === 'zh-CN' ? 'taobao' : 'npm',
  ),
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
    manuallyInstallStatus: 0,
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (
      prevState.manuallyInstallStatus > 1 &&
      prevState.manuallyInstallStatus === this.state.manuallyInstallStatus
    ) {
      this.setState({ manuallyInstallStatus: 0 })
    }
  }

  componentDidMount = async () => {
    this.setState({
      checkingUpdate: true,
      npmWorking: true,
    })
    const isNotif =
      window.config.get('config.packageManager.enablePluginCheck', true) && !this.props.autoUpdate // if we auto update plugins, don't toast notify
    const handleAutoUpdate = async () => {
      await PluginManager.getOutdatedPlugins(isNotif)
      if (this.props.autoUpdate) {
        const plugins = PluginManager.getInstalledPlugins()
        await Promise.each(Object.keys(plugins), async index => {
          if (plugins[index].isOutdated) {
            try {
              await this.handleUpdate(index)()
            } catch (error) {
              throw error
            }
          }
        })
      }
    }
    PluginManager.on('initialized', handleAutoUpdate)
    this.setState({
      checkingUpdate: false,
      npmWorking: false,
    })
  }

  handleEnable = memoize(index => async () => {
    const plugin = this.props.plugins[index]
    switch (PluginManager.getStatusOfPlugin(plugin)) {
    case PluginManager.DISABLED:
      await PluginManager.enablePlugin(plugin)
      break
    case PluginManager.VALID:
      await PluginManager.disablePlugin(plugin)
      break
    }
  })

  handleReload = memoize(index => () => {
    PluginManager.reloadPlugin(this.props.plugins[index])
  })

  handleInstall = memoize(name => async () => {
    let installingPluginNames = [...this.state.installingPluginNames, name]
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
      this.setState({ npmWorking: false })
      throw error
    }
  })

  handleUpdate = memoize(index => async () => {
    this.setState({ npmWorking: true })
    const plugins = PluginManager.getInstalledPlugins()
    const plugin = plugins[index]
    if (plugin.linkedPlugin) {
      this.setState({ npmWorking: false })
      return
    }
    try {
      await PluginManager.installPlugin(plugin.packageName, plugin.latestVersion)
    } catch (error) {
      throw error
    } finally {
      this.setState({ npmWorking: false })
    }
  })

  doInstallAll = async () => {
    this.setState({
      installingAll: true,
      npmWorking: true,
    })
    const settings = PluginManager.getUninstalledPluginSettings()

    await Promise.each(Object.keys(settings), async name => {
      try {
        await this.handleInstall(name)()
      } catch (e) {
        console.error(e)
      }
    })
    this.setState({
      installingAll: false,
      npmWorking: false,
    })
  }

  handleInstallAll = () => {
    const { t } = this.props
    window.toggleModal(t('Install all'), t('install-all-confirmation'), [
      {
        name: t('others:Confirm'),
        func: this.doInstallAll,
        style: 'warning',
      },
    ])
  }

  handleUpdateAll = async () => {
    this.setState({
      updatingAll: true,
      npmWorking: true,
    })
    const plugins = PluginManager.getInstalledPlugins()

    await Promise.each(Object.keys(plugins), async index => {
      if (plugins[index].isOutdated) {
        try {
          await this.handleUpdate(index)()
        } catch (error) {
          throw error
        }
      }
    })
    this.setState({
      updatingAll: false,
      npmWorking: false,
    })
  }

  handleRemove = memoize(index => async () => {
    this.setState({ npmWorking: true })
    try {
      const plugins = PluginManager.getInstalledPlugins()
      const plugin = plugins[index]
      await PluginManager.uninstallPlugin(plugin)
    } catch (error) {
      throw error
    } finally {
      this.setState({ npmWorking: false })
    }
  })

  checkUpdate = async () => {
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

  handleOpenPluginFolder = () => {
    shell.openItem(path.join(PLUGIN_PATH, 'node_modules'))
  }

  handleOpenSite = e => {
    shell.openExternal('https://www.npmjs.com/search?q=poi-plugin')
    e.preventDefault()
  }

  handleInstallByName = async name => {
    this.setState({ manuallyInstallStatus: 1 })
    try {
      await this.handleInstall(name)()
      this.setState({ manuallyInstallStatus: 2 })
    } catch (error) {
      this.setState({ manuallyInstallStatus: 3 })
    }
  }

  handleGracefulRepair = () => {
    const { t } = this.props
    window.toggleModal(t('Repair plugins'), t('repair-plugins-confirmation'), [
      {
        name: t('others:Confirm'),
        func: this.gracefulRepair,
        style: 'warning',
      },
    ])
  }

  gracefulRepair = async () => {
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

  render() {
    const { t } = this.props
    const { manuallyInstallStatus } = this.state

    const uninstalledPluginSettings = PluginManager.getUninstalledPluginSettings()

    const updateStatusFAname = this.state.updatingAll ? 'spinner' : 'cloud-download'

    const installStatusFAname = this.state.installingAll ? 'spinner' : 'download'

    let installStatusIntent, installStatusText
    switch (manuallyInstallStatus) {
    case 1:
      installStatusIntent = Intent.NONE
      installStatusText = <>{t('setting:Installing')}...</>
      break
    case 2:
      installStatusIntent = Intent.SUCCESS
      installStatusText = t('setting:Plugins are installed successfully')
      break
    case 3:
      installStatusIntent = Intent.DANGER
      installStatusText = t('setting:InstallFailedMsg')
      break
    default:
      installStatusIntent = Intent.WARNING
      installStatusText = ''
    }

    return (
      <>
        {window.isSafeMode && (
          <Callout intent={Intent.WARNING}>
            {t('setting:Poi is running in safe mode, plugins are not enabled automatically')}
          </Callout>
        )}
        <Card>
          <Control className="plugin-manage-control">
            <ButtonGroup fill>
              <SettingButton onClick={this.checkUpdate} disabled={this.state.checkingUpdate}>
                <FontAwesome name="refresh" spin={this.state.checkingUpdate} />
                <span> {t('setting:Check Update')}</span>
              </SettingButton>
              <SettingButton
                onClick={this.handleUpdateAll}
                disabled={
                  this.state.npmWorking ||
                  this.state.checkingUpdate ||
                  !PluginManager.getUpdateStatus()
                }
              >
                <FontAwesome name={updateStatusFAname} pulse={this.state.updatingAll} />
                <span> {t('setting:Update all')}</span>
              </SettingButton>
              <SettingButton
                onClick={this.handleInstallAll}
                disabled={
                  this.state.npmWorking || Object.keys(uninstalledPluginSettings).length === 0
                }
              >
                <FontAwesome name={installStatusFAname} pulse={this.state.installingAll} />
                <span> {t('setting:Install all')}</span>
              </SettingButton>
              <AdvancePopover
                position={Position.BOTTOM}
                targetTagName="div"
                content={
                  <Menu>
                    <MenuItem
                      text={t('setting:Open plugin folder')}
                      onClick={this.handleOpenPluginFolder}
                    />
                    <MenuItem text={t('setting:Search for plugins')} onClick={this.handleOpenSite} />
                    <MenuItem
                      text={t('setting:Repair plugins')}
                      onClick={this.handleGracefulRepair}
                    />
                  </Menu>
                }
              >
                <AdvanceButton>
                  <FontAwesome name="gear" />
                  <span> {t('setting:Advanced')}</span>
                </AdvanceButton>
              </AdvancePopover>
            </ButtonGroup>
          </Control>

          <Control className="install-plugin-by-name">
            {manuallyInstallStatus > 0 && (
              <Callout intent={installStatusIntent}>{installStatusText}</Callout>
            )}
            <NameInput
              onInstall={this.handleInstallByName}
              status={manuallyInstallStatus}
              npmWorking={this.state.npmWorking}
            />
          </Control>
        </Card>

        <div className="plugin-list">
          {this.props.plugins.map((plugin, index) => (
            <PluginItem
              key={plugin.id}
              plugin={plugin}
              onUpdate={this.handleUpdate(index)}
              onEnable={this.handleEnable(index)}
              onRemove={this.handleRemove(index)}
              onReload={this.handleReload(index)}
            />
          ))}
          {Object.keys(uninstalledPluginSettings).map((name, index) => {
            const plugin = uninstalledPluginSettings[name]
            return (
              <PluginItem
                installable
                key={name}
                plugin={plugin}
                npmWorking={this.state.npmWorking}
                installing={this.state.installingPluginNames.includes(name)}
                onInstall={this.handleInstall(name)}
              />
            )
          })}
        </div>
      </>
    )
  }
}
