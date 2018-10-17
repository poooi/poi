import path from 'path-extra'
import fs from 'fs-extra'
import { shell } from 'electron'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { get, map } from 'lodash'
import { fileUrl } from 'views/utils/tools'
import { translate } from 'react-i18next'
import { HTMLSelect, Button, ControlGroup, FormGroup, Intent, Position } from '@blueprintjs/core'
import styled from 'styled-components'

import { Section, Wrapper, FillAvailable } from 'views/components/settings/components/section'
import { SwitchConfig } from 'views/components/settings/components/switch'
import { FolderPickerConfig } from 'views/components/settings/components/folder-picker'
import { Tooltip } from 'views/components/etc/panel-tooltip'

const { config, toggleModal, EXROOT } = window
const { openItem } = shell

const toggleModalWithDelay = (...arg) => setTimeout(() => toggleModal(...arg), 1500)

const PreviewImage = styled.img`
  max-width: 30em;
  max-height: 15em;
`

const SWITCHES = [
  {
    label: 'Use SVG Icon',
    configName: 'poi.appearance.svgicon',
    defaultValue: false,
  },
  {
    label: 'Enable Smooth Transition',
    configName: 'poi.transition.enable',
    defaultValue: true,
  },
  {
    label: 'Show shipgirl avatar',
    configName: 'poi.appearance.avatar',
    defaultValue: false,
  },
]

@translate(['setting'])
@connect((state, props) => ({
  themes: get(state, 'ui.themes'),
  theme: get(state.config, 'poi.appearance.theme', 'paperdark'),
  enableSVGIcon: get(state.config, 'poi.appearance.svgicon', false),
  enableTransition: get(state.config, 'poi.transition.enable', true),
  useGridMenu: get(state.config, 'poi.tabarea.grid', navigator.maxTouchPoints !== 0),
  vibrant: get(state.config, 'poi.appearance.vibrant', 0), // 0: disable, 1: macOS vibrant, 2: custom background
  background: get(state.config, 'poi.appearance.background'),
  enableAvatar: get(state.config, 'poi.appearance.avatar', true),
}))
export class ThemeConfig extends Component {
  static propTypes = {
    themes: PropTypes.arrayOf(PropTypes.string),
    theme: PropTypes.string,
    enableSVGIcon: PropTypes.bool,
    enableTransition: PropTypes.bool,
    useGridMenu: PropTypes.bool,
    vibrant: PropTypes.number,
    background: PropTypes.string,
    enableAvatar: PropTypes.bool,
  }

  state = {
    show: false,
  }

  handleSetTheme = e => {
    const theme = e.target.value
    if (this.props.theme !== theme) {
      return window.applyTheme(theme)
    }
  }

  handleOpenCustomCss = e => {
    try {
      const d = path.join(EXROOT, 'hack', 'custom.css')
      fs.ensureFileSync(d)
      return openItem(d)
    } catch (e) {
      return toggleModalWithDelay(
        this.props.t('setting:Edit custom CSS'),
        this.props.t('NoPermission'),
      )
    }
  }

  handleSetSVGIcon = () => {
    config.set('poi.appearance.svgicon', !this.props.enableSVGIcon)
  }

  handleSetTransition = () => {
    config.set('poi.transition.enable', !this.props.enableTransition)
  }

  handleSetGridMenu = () => {
    config.set('poi.tabarea.grid', !this.props.useGridMenu)
  }

  handleSetVibrancy = e => {
    config.set('poi.appearance.vibrant', parseInt(e.target.value))
  }

  handleSetAvatar = e => {
    config.set('poi.appearance.avatar', !this.props.enableAvatar)
  }

  handleMouseEnter = () => {
    this.setState({
      show: true,
    })
  }

  handleMouseLeave = () => {
    this.setState({
      show: false,
    })
  }

  render() {
    const { t } = this.props
    return (
      <Section title={t('Themes')}>
        <Wrapper>
          <FormGroup inline>
            <Wrapper>
              <ControlGroup>
                <HTMLSelect value={this.props.theme} onChange={this.handleSetTheme}>
                  {this.props.themes.map((theme, index) => (
                    <option key={index} value={theme}>
                      {theme[0].toUpperCase() + theme.slice(1)}
                    </option>
                  ))}
                </HTMLSelect>
                <HTMLSelect value={this.props.vibrant} onChange={this.handleSetVibrancy}>
                  <option key={0} value={0}>
                    {t('setting:Default')}
                  </option>
                  {['darwin', 'win32'].includes(process.platform) && (
                    <option key={1} value={1}>
                      {t('setting:Vibrance')}
                    </option>
                  )}
                  <option key={2} value={2}>
                    {t('setting:Custom background')}
                  </option>
                </HTMLSelect>
              </ControlGroup>
              <Button minimal intent={Intent.PRIMARY} onClick={this.handleOpenCustomCss}>
                {t('setting:Edit custom CSS')}
              </Button>
            </Wrapper>
          </FormGroup>

          {this.props.vibrant === 2 && (
            <FillAvailable>
              <FormGroup inline label={t('Background')}>
                <FolderPickerConfig
                  label={t('setting:Custom background')}
                  configName="poi.appearance.background"
                  defaultValue={''}
                  isFolder={false}
                  placeholder={t('setting:No background image selected')}
                  extraControl={
                    <Tooltip
                      disabled={!this.props.background}
                      position={Position.BOTTOM_RIGHT}
                      content={
                        <PreviewImage src={encodeURI(fileUrl(this.props.background))} alt="" />
                      }
                    >
                      <Button intent={Intent.PRIMARY} minimal>{t('Preview')}</Button>
                    </Tooltip>
                  }
                />
              </FormGroup>
            </FillAvailable>
          )}

          {map(SWITCHES, ({ label, configName, defaultValue, platform }) => (
            <FillAvailable>
              <FormGroup inline>
                <SwitchConfig
                  label={t(label)}
                  configName={configName}
                  defaultValue={defaultValue}
                />
              </FormGroup>
            </FillAvailable>
          ))}
        </Wrapper>
      </Section>
    )
  }
}
