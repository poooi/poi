import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
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
import styled, { css } from 'styled-components'
import Transition from 'react-transition-group/Transition'

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

const PluginInfo = styled.div``

const PluginMeta = styled.div`
  margin-left: -0.5em;

  a {
    font-size: 1em;
  }
`

const PluginDetail = styled.div`
  position: relative;
`

const Fade1 = styled.div`
  transition: 0.3s ease-in-out;
  opacity: 0;
  ${({state}) => {
    switch (state) {
    case 'entering': return css`opacity: 0;`
    case 'entered': return css`opacity: 1;`
    case 'exiting': return css`opacity: 0;`
    case 'exited': return css`display: none;`
    }
  }}
`

const Fade2 = styled(Fade1)`
  ${({state}) => {
    switch (state) {
    case 'entering': return css`position: absolute;top:0;`
    case 'exiting': return css`position: absolute;top:0;`
    }
  }}
`

@translate(['setting'])
export class PluginItem extends PureComponent {
  static propTypes = {
    plugin: PropTypes.object,
    onUpdate: PropTypes.func,
    onEnable: PropTypes.func,
    onRemove: PropTypes.func,
    onReload: PropTypes.func,
    t: PropTypes.func.isRequired,
    installable: PropTypes.bool,
    installing: PropTypes.bool,
    npmWorking: PropTypes.bool,
    onInstall: PropTypes.func,
  }

  state = {
    settingOpen: false,
  }

  toggleSettingPop = () => {
    this.setState({ settingOpen: !this.state.settingOpen })
  }

  render() {
    const { plugin, installable, installing, npmWorking, t } = this.props
    const { settingOpen } = this.state

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

    const settingAvailable =
      plugin.reactClass ||
      plugin.settingsClass ||
      plugin.switchPluginPath ||
      (!plugin.multiWindow && plugin.windowURL)

    return (
      <Card className="plugin-item">
        <Header className="plugin-header">
          <PluginName className="plugin-name">
            {installable ? (
              <>
                <FontAwesome name={plugin.icon} />
                {` ${plugin[window.language]}`}
              </>
            ) : (
              plugin.displayName
            )}
          </PluginName>
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
            {installable ? (
              <Tooltip position={Position.TOP} content={t(installing ? 'Installing' : 'Install')}>
                <Button
                  minimal
                  intent={Intent.PRIMARY}
                  disabled={npmWorking}
                  onClick={this.props.onInstall}
                >
                  <FontAwesome name="download" />
                </Button>
              </Tooltip>
            ) : (
              <>
                <Tooltip position={Position.TOP} content={enableBtnText}>
                  <Button
                    minimal
                    intent={Intent.PRIMARY}
                    disabled={PluginManager.getStatusOfPlugin(plugin) == PluginManager.NEEDUPDATE}
                    onClick={
                      PluginManager.getStatusOfPlugin(plugin) != PluginManager.BROKEN
                        ? this.props.onEnable
                        : this.props.onReload
                    }
                  >
                    <FontAwesome name={enableBtnFAname} />
                  </Button>
                </Tooltip>
                <Tooltip position={Position.TOP} content={removeBtnText}>
                  <Button
                    minimal
                    intent={Intent.DANGER}
                    onClick={this.props.onRemove}
                    disabled={!plugin.isInstalled}
                  >
                    <FontAwesome name={removeBtnFAname} />
                  </Button>
                </Tooltip>
              </>
            )}
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
            {!installable && (
              <AnchorButton minimal intent={Intent.PRIMARY}>
                <FontAwesome name="tag" /> {plugin.version || '1.0.0'}
              </AnchorButton>
            )}
            {plugin.isOutdated && (
              <AnchorButton minimal intent={Intent.SUCCESS} onClick={this.props.onUpdate}>
                <FontAwesome name="cloud-download" /> {t('Available')} {plugin.latestVersion}
              </AnchorButton>
            )}
            {plugin.isUpdating && (
              <AnchorButton minimal intent={Intent.PRIMARY}>
                <FontAwesome name="spinner" pulse /> {t('Updating')}
              </AnchorButton>
            )}
          </PluginMeta>
          <PluginDetail className="plugin-detail">
            <Transition in={settingOpen} timeout={300}>
              {state => (
                <Fade1 className="plugin-setting" state={state}>
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
                </Fade1>
              )}
            </Transition>
            <Transition in={!settingOpen} timeout={300}>
              {state => (
                <Fade2 className="plugin-description" state={state}>
                  <ReactMarkdown
                    source={installable ? plugin[`des${window.language}`] : plugin.description}
                  />
                </Fade2>
              )}
            </Transition>
          </PluginDetail>
        </PluginInfo>
      </Card>
    )
  }
}
