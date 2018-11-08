import classnames from 'classnames'
import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { Col, Row, Label, Collapse, Well, Panel } from 'react-bootstrap'
import ReactMarkdown from 'react-remarkable'
import { Trans, translate } from 'react-i18next'
import {
  Card,
  ButtonGroup,
  Button,
  Tooltip,
  Position,
  Intent,
  AnchorButton,
} from '@blueprintjs/core'
import styled from 'styled-components'

import { CheckboxLabelConfig } from '../components/checkbox'
import PluginManager from 'views/services/plugin-manager'

import { PluginSettingWrapper } from './plugin-setting-wrapper'

const Header = styled.div`
  display: flex;
  align-items: center;
`

const PluginName = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  font-size: 1.5em;
`

const PluginInfo = styled.div`
`

const PluginMeta = styled.div`
  margin-left: -0.5em;

  a {
    font-size: 1em;
  }
`

@translate(['setting'])
export class InstalledPlugin extends PureComponent {
  static propTypes = {
    plugin: PropTypes.object,
    handleUpdate: PropTypes.func,
    handleEnable: PropTypes.func,
    handleRemove: PropTypes.func,
    handleReload: PropTypes.func,
    t: PropTypes.func.isRequired,
  }

  state = {
    settingOpen: false,
  }

  toggleSettingPop = () => {
    this.setState({ settingOpen: !this.state.settingOpen })
  }

  render() {
    const { plugin, t } = this.props
    const { settingOpen } = this.state

    const outdatedLabelbsStyle = !plugin.latestVersion.includes('beta') ? 'primary' : 'warning'

    const outdatedLabelFAname = classnames({
      spinner: plugin.isUpdating,
      'cloud-download': !plugin.isUpdating && plugin.isOutdated,
      check: !plugin.isUpdating && !plugin.isOutdated,
    })

    const outdatedLabelText = plugin.isUpdating ? (
      <Trans>setting:Updating</Trans>
    ) : plugin.isOutdated ? (
      `Version ${plugin.latestVersion}`
    ) : (
      <Trans>setting:Latest</Trans>
    )

    let enableBtnText, enableBtnFAname

    switch (PluginManager.getStatusOfPlugin(plugin)) {
    case PluginManager.VALID:
      enableBtnText = <Trans>setting:Disable</Trans>
      enableBtnFAname = 'pause'
      break
    case PluginManager.DISABLED:
      enableBtnText = <Trans>setting:Enable</Trans>
      enableBtnFAname = 'play'
      break
    case PluginManager.NEEDUPDATE:
      enableBtnText = <Trans>setting:Outdated</Trans>
      enableBtnFAname = 'ban'
      break
    case PluginManager.BROKEN:
      enableBtnText = <Trans>setting:Reload</Trans>
      enableBtnFAname = 'refresh'
      break
    default:
      enableBtnText = ''
      enableBtnFAname = ''
    }

    const removeBtnText = plugin.isUninstalling ? (
      <Trans>setting:Removing</Trans>
    ) : (
      <Trans>setting:Remove</Trans>
    )

    const removeBtnFAname = plugin.isInstalled ? 'trash' : 'trash-o'

    const panelClass = classnames('plugin-content', {
      'plugin-content-disabled': PluginManager.getStatusOfPlugin(plugin) !== PluginManager.VALID,
    })

    const outdatedLabelClass = classnames('update-label', {
      hidden: !plugin.isOutdated,
    })

    const settingAvailable =
      plugin.reactClass ||
      plugin.settingsClass ||
      plugin.switchPluginPath ||
      (!plugin.multiWindow && plugin.windowURL)

    const btnGroupClass = classnames('plugin-buttongroup', {
      'btn-xs-12': settingAvailable,
      'btn-xs-8': !settingAvailable,
    })

    const btnClass = classnames('plugin-control-button', {
      'btn-xs-4': settingAvailable,
      'btn-xs-6': !settingAvailable,
    })

    return (
      <Card className="plugin-item">
        <Header className="plugin-header">
          <PluginName className="plugin-name">{plugin.displayName}</PluginName>
          <ButtonGroup className="plugin-control">
            {settingAvailable && (
              <Tooltip
                position={Position.TOP}
                content={t(settingOpen ? 'Description' : 'Settings')}
              >
                <Button minimal intent={Intent.PRIMARY} onClick={this.toggleSettingPop}>
                  <FontAwesome name={settingOpen ? 'file-alt' : 'gear'} />
                </Button>
              </Tooltip>
            )}
            <Tooltip position={Position.TOP} content={enableBtnText}>
              <Button
                minimal
                intent={Intent.PRIMARY}
                disabled={PluginManager.getStatusOfPlugin(plugin) == PluginManager.NEEDUPDATE}
                onClick={
                  PluginManager.getStatusOfPlugin(plugin) != PluginManager.BROKEN
                    ? this.props.handleEnable
                    : this.props.handleReload
                }
              >
                <FontAwesome name={enableBtnFAname} />
              </Button>
            </Tooltip>
            <Tooltip position={Position.TOP} content={removeBtnText}>
              <Button
                minimal
                intent={Intent.DANGER}
                onClick={this.props.handleRemove}
                disabled={!plugin.isInstalled}
              >
                <FontAwesome name={removeBtnFAname} />
              </Button>
            </Tooltip>
          </ButtonGroup>
        </Header>
        <PluginInfo className="plugin-info">
          <PluginMeta className="plugin-meta">
            <AnchorButton minimal intent={Intent.PRIMARY} href={plugin.link}>
              <FontAwesome name="user" /> {plugin.author}
            </AnchorButton>
            {plugin.linkedPlugin && (
              <AnchorButton minimal intent={Intent.PRIMARY}>
                <FontAwesome name="link" /> {t('Linked')}
              </AnchorButton>
            )}
            <AnchorButton minimal intent={Intent.PRIMARY}>
              <FontAwesome name="tag" /> {plugin.version || '1.0.0'}
            </AnchorButton>
            {
              plugin.isOutdated &&
              <AnchorButton minimal intent={Intent.SUCCESS} onClick={this.props.handleUpdate}>
                <FontAwesome name="cloud-download" /> {t('Available')} {plugin.latestVersion}
              </AnchorButton>
            }
            {
              plugin.isUpdating &&
              <AnchorButton minimal intent={Intent.PRIMARY}>
                <FontAwesome name="spinner" pulse /> {t('Updating')}
              </AnchorButton>
            }
          </PluginMeta>
          <div className="plugin-detail">
            {settingOpen ? (
              <div className="plugin-setting">
                {!!plugin.reactClass && (
                  <div>
                    <CheckboxLabelConfig
                      label={<Trans>setting:Open plugin in new window</Trans>}
                      configName={`poi.plugin.windowmode.${plugin.id}`}
                      defaultValue={!!plugin.windowMode}
                    />
                  </div>
                )}
                {!!plugin.switchPluginPath && (
                  <div>
                    <CheckboxLabelConfig
                      label={<Trans>setting:Enable auto switch</Trans>}
                      configName={`poi.autoswitch.${plugin.id}`}
                      defaultValue={true}
                    />
                  </div>
                )}
                {!plugin.multiWindow && plugin.windowURL && (
                  <div>
                    <CheckboxLabelConfig
                      label={
                        <Trans>
                          setting:Keep plugin process running in background (re-enable to apply
                          changes)
                        </Trans>
                      }
                      configName={`poi.plugin.background.${plugin.id}`}
                      defaultValue={!plugin.realClose}
                    />
                  </div>
                )}
                {!!plugin.settingsClass && (
                  <div>
                    <PluginSettingWrapper plugin={plugin} key={plugin.timestamp || 0} />
                  </div>
                )}
              </div>
            ) : (
              <div className="plugin-description">
                <ReactMarkdown source={plugin.description} />
              </div>
            )}
          </div>
        </PluginInfo>
      </Card>
    )
  }
}
