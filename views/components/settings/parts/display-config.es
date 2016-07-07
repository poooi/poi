import path from 'path-extra'
import fs from 'fs-extra'
import { remote, shell } from 'electron'
import { Grid, Col, Button, ButtonGroup, Input, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { connect } from 'react-redux'
import { Component } from 'react'
import Divider from './divider'
import { get } from 'lodash'

const {config, toggleModal} = window
const {showItemInFolder, openItem} = shell
const __ = i18n.setting.__.bind(i18n.setting)
const __n = i18n.setting.__n.bind(i18n.setting)
const confGet = (target, path, value) =>
  ((typeof get(target, path) === "undefined") ? value : get(target, path))

config.on('config.set', (path, value) => {
  let event
  switch (path) {
    case 'poi.layout':
      window.layout = value
      event = new CustomEvent('layout.change', {
        bubbles: true,
        cancelable: true,
        detail: {
          layout: value
        }
      })
      window.dispatchEvent(event)
      toggleModal(__('Layout settings'), __('Some plugins may not work before you refresh the page.'))
      break
    case 'poi.tabarea.double':
      event = new CustomEvent('doubleTabbed.change', {
        bubbles: true,
        cancelable: true,
        detail: {
          doubleTabbed: value
        }
      })
      window.dispatchEvent(event)
      window.doubleTabbed = value
      toggleModal(__('Layout settings'), __('Some plugins may not work before you refresh the page.'))
      break
    case 'poi.useSVGIcon':
      window.useSVGIcon = value
      break
    case 'poi.transition.enable':
      window.dispatchEvent(new Event('display.transition.change'))
      break
    case 'poi.zoomLevel':
      window.zoomLevel = zoomLevel
      break
    default:

  }
})

const ChangeLayoutConfig = connect(() => (
  (state, props) => ({
    layout: confGet(state.config, 'poi.layout', 'horizontal'),
    enableDoubleTabbed: confGet(state.config, 'poi.tabarea.double', false),
  })
))(class extends Component {
  handleSetLayout = (layout) => {
    config.set('poi.layout', layout);
  }
  handleSetDoubleTabbed = () => {
    config.set('poi.tabarea.double', !this.props.enableDoubleTabbed);
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
          <Input type="checkbox" label={__('Split component and plugin panel')} checked={this.props.enableDoubleTabbed} onChange={this.handleSetDoubleTabbed} />
        </Col>
      </Grid>
    )
  }
})

const ChangeThemeConfig = connect((state, props) => ({
  theme: confGet(state.config, 'poi.theme', 'paperdark'),
  enableSVGIcon: confGet(state.config, 'poi.useSVGIcon', false),
  enableTransition: confGet(state.config, 'poi.transition.enable', true),
})
)(class extends Component {
  handleSetTheme = () => {
    let theme = this.refs.theme.getValue();
    if (this.props.theme !== theme) {
      return window.applyTheme(theme);
    }
  }
  handleOpenCustomCss = (e) => {
    try {
      let d = path.join(EXROOT, 'hack', 'custom.css');
      fs.ensureFileSync(d);
      return openItem(d);
    } catch (e) {
      return toggleModal(__('Edit custom CSS'), __("Failed. Perhaps you don't have permission to it."));
    }
  }
  handleSetSVGIcon = () => {
    config.set('poi.useSVGIcon', !this.props.enableSVGIcon);
  }
  handleSetTransition = () => {
    config.set('poi.transition.enable', !this.props.enableTransition);
  }
  render() {
    return (
      <Grid>
        <Col xs={6}>
          <Input type="select" ref="theme" value={this.props.theme} onChange={this.handleSetTheme}>
            {
              window.allThemes.map((theme, index) =>
                <option key={index} value={theme}>
                  {(theme === '__default__') ? 'Default' : (theme[0].toUpperCase() + theme.slice(1))}
                </option>
              )
            }
          </Input>
        </Col>
        <Col xs={6}>
          <Button bsStyle='primary' onClick={this.handleOpenCustomCss} block>{__('Edit custom CSS')}</Button>
        </Col>
        <Col xs={12}>
          <Input type="checkbox" label={__('Use SVG Icon')} checked={this.props.enableSVGIcon} onChange={this.handleSetSVGIcon} />
        </Col>
        <Col xs={12}>
          <Input type="checkbox" label={__('Enable Smooth Transition')} checked={this.props.enableTransition} onChange={this.handleSetTransition} />
        </Col>
      </Grid>
    )
  }
})

const ZoomingConfig = connect(() => (
  (state, props) => ({
    zoomLevel: confGet(state.config, 'poi.zoomLevel', 1)
  })
))(class extends Component {
  handleChangeZoomLevel = (e) => {
    config.set('poi.zoomLevel', parseFloat(this.refs.zoomLevel.getValue()));
  }
  render() {
    return (
      <Grid>
        <Col xs={6}>
          <OverlayTrigger placement='top' overlay={
              <Tooltip id='displayconfig-zoom'>{__('Zoom level')} <strong>{parseInt(this.props.zoomLevel * 100)}%</strong></Tooltip>
            }>
            <Input type="range" ref="zoomLevel" onInput={this.handleChangeZoomLevel}
              min={0.5} max={2.0} step={0.05} defaultValue={this.props.zoomLevel} />
          </OverlayTrigger>
        </Col>
      </Grid>
    )
  }
})

const ChangeResolutionConfig = connect((state, props) => ({
  webview: state.layout.webview,
}))(class extends Component {
  handleSetWebviewWidth = (node, e) => {
    let useFixedResolution = this.props.webview.useFixedResolution
    let width = parseInt(this.refs[node].getValue())
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
          <Input type='checkbox'
           ref="useFixedResolution"
           label={__('Adaptive resolution based on the window')}
           checked={!this.props.webview.useFixedResolution} onChange={this.handleSetFixedResolution} />
        </Col>
        <Col xs={4}>
          <Input type="select"
           ref="webviewWidthRatio"
           value={this.props.webview.width}
           onChange={this.handleSetWebviewWidth.bind(this, "webviewWidthRatio")}
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
          </Input>
        </Col>
        <Col id="poi-resolution-config" xs={12} style={{display: 'flex', alignItems: 'center'}}>
          <div style={{flex: 1}}>
            <Input type="number"
             ref="webviewWidth"
             value={Math.round(this.props.webview.width)}
             onChange={this.handleSetWebviewWidth.bind(this, "webviewWidth")}
             readOnly={!this.props.webview.useFixedResolution} />
          </div>
          <div style={{flex: 'none', width: 15, paddingLeft: 5}}>
            x
          </div>
          <div style={{flex: 1}}>
            <Input type="number" value={Math.round(this.props.webview.height)} readOnly />
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
          <Divider text={__('Game resoultion')} />
          <ChangeResolutionConfig />
        </div>
      </form>
    )
  }
}

export default DisplayConfig
