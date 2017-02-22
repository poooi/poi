import path from 'path-extra'
import fs from 'fs-extra'
import { shell } from 'electron'
import { Grid, Col, Button, FormControl, Checkbox, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { connect } from 'react-redux'
import React from 'react'
import Divider from './divider'
import { get } from 'lodash'

const {config, toggleModal, i18n, EXROOT} = window
const {openItem} = shell
const {Component} = React
const __ = i18n.setting.__.bind(i18n.setting)

config.on('config.set', (path, value) => {
  let event
  switch (path) {
  case 'poi.layout':
    event = new CustomEvent('layout.change', {
      bubbles: true,
      cancelable: true,
      detail: {
        layout: value,
      },
    })
    window.dispatchEvent(event)
    toggleModal(__('Layout settings'), __('Some plugins may not work before you refresh the page.'))
    break
  case 'poi.tabarea.double':
    event = new CustomEvent('doubleTabbed.change', {
      bubbles: true,
      cancelable: true,
      detail: {
        doubleTabbed: value,
      },
    })
    window.dispatchEvent(event)
    toggleModal(__('Layout settings'), __('Some plugins may not work before you refresh the page.'))
    break
  case 'poi.transition.enable':
    window.dispatchEvent(new Event('display.transition.change'))
    break
  default:
  }
})

const ChangeLayoutConfig = connect(() => (
  (state, props) => ({
    layout: get(state.config, 'poi.layout', 'horizontal'),
    enableDoubleTabbed: get(state.config, 'poi.tabarea.double', false),
  })
))(class changeLayoutConfig extends Component {
  static propTypes = {
    enableDoubleTabbed: React.PropTypes.bool,
    layout: React.PropTypes.string,
  }
  handleSetLayout = (layout) => {
    config.set('poi.layout', layout)
  }
  handleSetDoubleTabbed = () => {
    config.set('poi.tabarea.double', !this.props.enableDoubleTabbed)
  }
  render() {
    return (
      <Grid>
        <Col xs={6}>
          <Button bsStyle={(this.props.layout === 'horizontal') ? 'success' : 'danger'} onClick={this.handleSetLayout.bind(this, 'horizontal')} style={{width: '100%'}}>
            {(this.props.layout === 'horizontal') ? '√ ' : ''}{__('Use horizontal layout')}
          </Button>
        </Col>
        <Col xs={6}>
          <Button bsStyle={(this.props.layout === 'vertical') ? 'success' : 'danger'} onClick={this.handleSetLayout.bind(this, 'vertical')} style={{width: '100%'}}>
            {(this.props.layout === 'vertical') ? '√ ' : ''}{__('Use vertical layout')}
          </Button>
        </Col>
        <Col xs={12}>
          <Checkbox checked={this.props.enableDoubleTabbed} onChange={this.handleSetDoubleTabbed}>
            {__('Split component and plugin panel')}
          </Checkbox>
        </Col>
      </Grid>
    )
  }
})

const ChangeThemeConfig = connect((state, props) => ({
  theme: get(state.config, 'poi.theme', 'paperdark'),
  enableSVGIcon: get(state.config, 'poi.useSVGIcon', false),
  enableTransition: get(state.config, 'poi.transition.enable', true),
  useGridMenu: get(state.config, 'poi.tabarea.grid', navigator.maxTouchPoints !== 0),
})
)(class changeThemeConfig extends Component {
  static propTypes = {
    theme: React.PropTypes.string,
    enableSVGIcon: React.PropTypes.bool,
    enableTransition: React.PropTypes.bool,
    useGridMenu: React.PropTypes.bool,
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
      return toggleModal(__('Edit custom CSS'), __("Failed. Perhaps you don't have permission to it."))
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
  render() {
    return (
      <Grid>
        <Col xs={6}>
          <FormControl componentClass="select" value={this.props.theme} onChange={this.handleSetTheme}>
            {
              window.allThemes.map((theme, index) =>
                <option key={index} value={theme}>
                  {(theme === '__default__') ? 'Default' : (theme[0].toUpperCase() + theme.slice(1))}
                </option>
              )
            }
          </FormControl>
        </Col>
        <Col xs={6}>
          <Button bsStyle='primary' onClick={this.handleOpenCustomCss} block>{__('Edit custom CSS')}</Button>
        </Col>
        <Col xs={12}>
          <Checkbox checked={this.props.enableSVGIcon} onChange={this.handleSetSVGIcon}>
            {__('Use SVG Icon')}
          </Checkbox>
        </Col>
        <Col xs={12}>
          <Checkbox checked={this.props.enableTransition} onChange={this.handleSetTransition}>
            {__('Enable Smooth Transition')}
          </Checkbox>
        </Col>
        <Col xs={12}>
          <Checkbox checked={this.props.useGridMenu} onChange={this.handleSetGridMenu}>
            {__('Use Gridded Plugin Menu')}
          </Checkbox>
        </Col>
      </Grid>
    )
  }
})

const ZoomingConfig = connect(() => (
  (state, props) => ({
    zoomLevel: get(state.config, 'poi.zoomLevel', 1),
  })
))(class zoomingConfig extends Component {
  static propTypes = {
    zoomLevel: React.PropTypes.number,
  }
  handleChangeZoomLevel = (e) => {
    config.set('poi.zoomLevel', parseFloat(e.target.value))
  }
  render() {
    return (
      <Grid>
        <Col xs={6}>
          <OverlayTrigger placement='top' overlay={
              <Tooltip id='displayconfig-zoom'>{__('Zoom level')} <strong>{parseInt(this.props.zoomLevel * 100)}%</strong></Tooltip>
            }>
            <FormControl type="range" onInput={this.handleChangeZoomLevel}
              min={0.5} max={2.0} step={0.05} defaultValue={this.props.zoomLevel} />
          </OverlayTrigger>
        </Col>
        <Col xs={6}>
          {__('Zoom level')} <strong>{parseInt(this.props.zoomLevel * 100)}%</strong>
        </Col>
      </Grid>
    )
  }
})

const PanelMinSizeConfig = connect(() => (
  (state, props) => ({
    panelMinSize: get(state.config, 'poi.panelMinSize', 1),
  })
))(class zoomingConfig extends Component {
  static propTypes = {
    panelMinSize: React.PropTypes.number,
  }
  handleChangeZoomLevel = (e) => {
    config.set('poi.panelMinSize', parseFloat(e.target.value))
  }
  render() {
    return (
      <Grid>
        <Col xs={6}>
          <OverlayTrigger placement='top' overlay={
              <Tooltip id='displayconfig-zoom'>{__('Minimal size')} <strong>{parseInt(this.props.panelMinSize * 100)}%</strong></Tooltip>
            }>
            <FormControl type="range" onInput={this.handleChangeZoomLevel}
              min={1.0} max={2.0} step={0.05} defaultValue={this.props.panelMinSize} />
          </OverlayTrigger>
        </Col>
        <Col xs={6}>
          {__('Minimal size')} <strong>{parseInt(this.props.panelMinSize * 100)}%</strong>
        </Col>
      </Grid>
    )
  }
})

const FlashQualityConfig = connect((state, props) => ({
  flashQuality: get(state.config, 'poi.flashQuality', 'high'),
  flashWindowMode: get(state.config, 'poi.flashWindowMode', 'window'),
}))(class flashQualityConfig extends Component {
  static propTypes = {
    flashQuality: React.PropTypes.string,
  }
  handleSetQuality = (e) => {
    config.set('poi.flashQuality', e.target.value)
  }
  handleSetWindowMode = (e) => {
    config.set('poi.flashWindowMode', e.target.value)
  }
  render() {
    const quality = ["low", "autolow", "autohigh", "medium", "high", "best"]
    const wmode = ["window", "direct", "opaque", "transparent", 'gpu']
    return (
      <Grid>
        <Col xs={6}>
          <FormControl componentClass="select"
            value={this.props.flashQuality}
            onChange={this.handleSetQuality}>
            {
              quality.map((v, i) => (
                <option key={i} value={v}>{v}</option>
              ))
            }
          </FormControl>
        </Col>
        <Col xs={6}>
          <FormControl componentClass="select"
            value={this.props.flashWindowMode}
            onChange={this.handleSetWindowMode}>
            {
              wmode.map((v, i) => (
                <option key={i} value={v}>{v}</option>
              ))
            }
          </FormControl>
        </Col>
      </Grid>
    )
  }
})

const ChangeResolutionConfig = connect((state, props) => ({
  webview: state.layout.webview,
}))(class changeResolutionConfig extends Component {
  static propTypes = {
    webview: React.PropTypes.object,
  }
  handleSetWebviewWidth = (e) => {
    const useFixedResolution = this.props.webview.useFixedResolution
    const width = parseInt(e.target.value)
    if (isNaN(width) || width < 0 || !useFixedResolution) {
      return
    }
    config.set('poi.webview.width', width)
  }
  handleSetFixedResolution = (e) => {
    if (this.props.webview.useFixedResolution) {
      config.set('poi.webview.width', -1)
    } else {
      config.set('poi.webview.width', this.props.webview.width)
    }
  }
  render() {
    return (
      <Grid>
        <Col xs={8}>
          <Checkbox
            ref="useFixedResolution"
            checked={!this.props.webview.useFixedResolution}
            onChange={this.handleSetFixedResolution}>
            {__('Adaptive resolution based on the window')}
          </Checkbox>
        </Col>
        <Col xs={4}>
          <FormControl componentClass="select"
           value={this.props.webview.width}
           onChange={this.handleSetWebviewWidth}
           disabled={!this.props.webview.useFixedResolution} >
            <option key={-1} value={this.props.webview.width} hidden>{Math.round(this.props.webview.width/800*100)}%</option>
            {
              [0, 1, 2, 3].map((i) => {
                return (
                  <option key={i} value={i * 400 + 400}>
                    {i * 50 + 50}%
                  </option>
                )
              })
            }
          </FormControl>
        </Col>
        <Col id="poi-resolution-config" xs={12} style={{display: 'flex', alignItems: 'center'}}>
          <div style={{flex: 1}}>
            <FormControl type="number"
             value={Math.round(this.props.webview.width)}
             onChange={this.handleSetWebviewWidth}
             readOnly={!this.props.webview.useFixedResolution} />
          </div>
          <div style={{flex: 'none', width: 15, paddingLeft: 5}}>
            x
          </div>
          <div style={{flex: 1}}>
            <FormControl type="number" value={Math.round(this.props.webview.height)} readOnly />
          </div>
          <div style={{flex: 'none', width: 15, paddingLeft: 5}}>
            px
          </div>
        </Col>
      </Grid>
    )
  }
})


class DisplayConfig extends Component {
  render() {
    return (
      <form>
        <div className="form-group">
          <Divider text={__("Layout")} />
          <ChangeLayoutConfig />
        </div>
        <div className="form-group">
          <Divider text={__('Themes')} />
          <ChangeThemeConfig />
        </div>
        <div className="form-group">
          <Divider text={__('Zoom')} />
          <ZoomingConfig />
        </div>
        <div className="form-group">
          <Divider text={__('Panel area')} />
          <PanelMinSizeConfig />
        </div>
        <div className="form-group">
          <Divider text={__('Flash Quality & Window Mode')} />
          <FlashQualityConfig />
        </div>
        <div className="form-group">
          <Divider text={__('Game resoultion')} />
          <ChangeResolutionConfig />
        </div>
      </form>
    )
  }
}

export default DisplayConfig
