import path from 'path-extra'
import fs from 'fs-extra'
import { shell } from 'electron'
import { Grid, Col, Button, FormControl, Checkbox, Overlay, Tooltip } from 'react-bootstrap'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { get } from 'lodash'
import FolderPicker from '../components/folder-picker'
import { fileUrl } from 'views/utils/tools'
import { avatarWorker } from 'views/services/worker'
import { Trans } from 'react-i18next'

const { config, toggleModal, EXROOT, APPDATA_PATH } = window
const { openItem } = shell

const toggleModalWithDelay = (...arg) => setTimeout(() => toggleModal(...arg), 1500)

const ThemeConfig = connect((state, props) => ({
  themes: get(state, 'ui.themes'),
  theme: get(state.config, 'poi.theme', 'paperdark'),
  enableSVGIcon: get(state.config, 'poi.useSVGIcon', false),
  enableTransition: get(state.config, 'poi.transition.enable', true),
  useGridMenu: get(state.config, 'poi.tabarea.grid', navigator.maxTouchPoints !== 0),
  vibrant: get(state.config, 'poi.vibrant', 0), // 0: disable, 1: macOS vibrant, 2: custom background
  background: get(state.config, 'poi.background'),
  enableAvatar: get(state.config, 'poi.enableAvatar', true),
})
)(class ThemeConfig extends Component {
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
  handleSetTheme = (e) => {
    const theme = e.target.value
    if (this.props.theme !== theme) {
      return window.applyTheme(theme)
    }
  }
  handleOpenCustomCss = (e) => {
    try {
      const d = path.join(EXROOT, 'hack', 'custom.css')
      fs.ensureFileSync(d)
      return openItem(d)
    } catch (e) {
      return toggleModalWithDelay(<Trans>setting:Edit custom CSS</Trans>, <Trans>NoPermission</Trans>)
    }
  }
  handleDeleteAvatarCache = async e => {
    try {
      const d = path.join(APPDATA_PATH, 'avatar')
      await fs.remove(d)
      avatarWorker.port.postMessage([ 'Initialize', true, window.APPDATA_PATH ])
    } catch (e) {
      return toggleModalWithDelay(<Trans>setting:Delete avatar cache</Trans>, <Trans>NoPermission</Trans>)
    }
  }
  handleSetSVGIcon = () => {
    config.set('poi.useSVGIcon', !this.props.enableSVGIcon)
  }
  handleSetTransition = () => {
    config.set('poi.transition.enable', !this.props.enableTransition)
  }
  handleSetGridMenu = () => {
    config.set('poi.tabarea.grid', !this.props.useGridMenu)
  }
  handleSetVibrancy = e => {
    config.set('poi.vibrant', parseInt(e.target.value))
  }
  handleSetAvatar = e => {
    config.set('poi.enableAvatar', !this.props.enableAvatar)
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
    return (
      <Grid>
        <Col xs={6}>
          <FormControl componentClass="select" value={this.props.theme} onChange={this.handleSetTheme}>
            {
              this.props.themes.map((theme, index) =>
                <option key={index} value={theme}>
                  {theme[0].toUpperCase() + theme.slice(1)}
                </option>
              )
            }
          </FormControl>
        </Col>
        <Col xs={6}>
          <FormControl componentClass="select" value={this.props.vibrant} onChange={this.handleSetVibrancy}>
            <option key={0} value={0}><Trans>setting:Default</Trans></option>
            { ['darwin', 'win32'].includes(process.platform) && <option key={1} value={1}><Trans>setting:Vibrance</Trans></option> }
            <option key={2} value={2}><Trans>setting:Custom background</Trans></option>
          </FormControl>
        </Col>
        <Col xs={6} style={{ marginTop: '1ex' }}>
          <Button bsStyle='primary' onClick={this.handleOpenCustomCss} block><Trans>setting:Edit custom CSS</Trans></Button>
        </Col>
        <Col xs={6} style={{ marginTop: '1ex' }}>
          <Overlay
            show={this.props.background && this.state.show }
            placement="bottom"
            target={this.fileSelect}
          >
            <Tooltip id='background-preview'>
              <img src={encodeURI(fileUrl(this.props.background))} alt="" style={{ maxHeight: '100%', maxWidth: '100%'}}/>
            </Tooltip>
          </Overlay>
          <div
            ref={(ref) => this.fileSelect = ref}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
          >
            {
              this.props.vibrant === 2 &&
              <FolderPicker
                label={<Trans>setting:Custom background</Trans>}
                configName="poi.background"
                defaultVal={''}
                isFolder={false}
                placeholder={<Trans>setting:No background image selected</Trans>}
              />
            }
          </div>
        </Col>
        <Col xs={12}>
          <Checkbox checked={this.props.enableSVGIcon} onChange={this.handleSetSVGIcon}>
            <Trans>setting:Use SVG Icon</Trans>
          </Checkbox>
        </Col>
        <Col xs={12}>
          <Checkbox checked={this.props.enableTransition} onChange={this.handleSetTransition}>
            <Trans>setting:Enable Smooth Transition</Trans>
          </Checkbox>
        </Col>
        <Col xs={12}>
          <Checkbox checked={this.props.useGridMenu} onChange={this.handleSetGridMenu}>
            <Trans>setting:Use Gridded Plugin Menu</Trans>
          </Checkbox>
        </Col>
        <Col xs={6}>
          <Checkbox checked={this.props.enableAvatar} onChange={this.handleSetAvatar}>
            <Trans>setting:Show shipgirl avatar</Trans>
          </Checkbox>
        </Col>
        <Col xs={6}>
          <Button bsStyle='primary' onClick={this.handleDeleteAvatarCache} block><Trans>setting:Delete avatar cache</Trans></Button>
        </Col>
      </Grid>
    )
  }
})

export default ThemeConfig
