import { Grid, Col, FormControl, Checkbox } from 'react-bootstrap'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { debounce, get } from 'lodash'
import { Trans } from 'react-i18next'
import { screen } from 'electron'

const { config } = window

function getMinArea (displays) {
  return {
    screenWidth: Math.max(...displays.map(d => d.bounds.width)),
    screenHeight: Math.max(...displays.map(d => d.bounds.height)),
  }
}

@connect((state, props) => ({
  webview: state.layout.webview,
  isolateGameWindow: get(state.config, 'poi.isolateGameWindow', false),
  key: get(state.config, 'poi.isolateGameWindow', false) ? 'i' + get(state.layout.webview, 'windowWidth') : 'n' + get(state.layout.webview, 'width'),
}))
export class ResolutionConfig extends Component {
  static propTypes = {
    webview: PropTypes.object,
  }
  state = {
    width: parseInt(this.props.isolateGameWindow ? this.props.webview.windowWidth : this.props.webview.width),
    ...getMinArea(screen.getAllDisplays()),
  }
  handleSetWebviewWidthWithDebounce = (value, isDebounced) => {
    this.setState({
      width: parseInt(value),
    })
    if (!this.handleSetWebviewWidthDebounced) {
      this.handleSetWebviewWidthDebounced = debounce(this.handleSetWebviewWidth, 1000, {leading:false, trailing:true})
    }
    if (isDebounced) {
      this.handleSetWebviewWidthDebounced(value)
    } else {
      this.handleSetWebviewWidth(value)
    }
  }
  handleSetWebviewWidth = (value) => {
    const useFixedResolution = this.props.isolateGameWindow ? this.props.webview.windowUseFixedResolution : this.props.webview.useFixedResolution
    const width = parseInt(value)
    if (isNaN(width) || width < 0 || !useFixedResolution) {
      return
    }
    if (width > this.state.screenWidth || width * 0.6 > this.state.screenHeight) {
      this.setState({
        width: config.get(this.props.isolateGameWindow ? 'poi.webview.windowWidth' : 'poi.webview.width', this.defaultWidth),
      })
      return
    }
    if (this.props.isolateGameWindow) {
      config.set('poi.webview.windowWidth', width)
    } else {
      config.set('poi.webview.width', width)
    }
  }
  handleSetFixedResolution = (e) => {
    if (this.props.isolateGameWindow) {
      config.set('poi.webview.windowUseFixedResolution', !this.props.webview.windowUseFixedResolution)
    } else {
      config.set('poi.webview.useFixedResolution', !this.props.webview.useFixedResolution)
    }
  }
  handleScreenStatusChange = () => {
    this.setState(getMinArea(screen.getAllDisplays()))
  }
  componentDidMount = () => {
    screen.addListener('display-added', this.handleScreenStatusChange)
    screen.addListener('display-removed', this.handleScreenStatusChange)
    screen.addListener('display-metrics-changed', this.handleScreenStatusChange)
    if (this.state.screenHeight < 900 || this.state.screenWidth < 1500) {
      config.setDefault('poi.webview.width', 800)
      this.defaultWidth = 800
    } else {
      config.setDefault('poi.webview.width', 1200)
      this.defaultWidth = 1200
    }
  }
  componentWillUnmount = () => {
    screen.removeListener('display-added', this.handleScreenStatusChange)
    screen.removeListener('display-removed', this.handleScreenStatusChange)
    screen.removeListener('display-metrics-changed', this.handleScreenStatusChange)
  }
  render() {
    const { isolateGameWindow, webview } = this.props
    const height = isolateGameWindow ? webview.windowHeight : webview.height
    const useFixedResolution = isolateGameWindow ? webview.windowUseFixedResolution : webview.useFixedResolution
    const labelText = `${Math.round(this.state.width / 1200 * 100)}%`
    return (
      <Grid>
        <Col xs={8}>
          <Checkbox
            checked={useFixedResolution}
            onChange={this.handleSetFixedResolution}>
            <Trans>setting:Use certain resolution for game area</Trans>
          </Checkbox>
        </Col>
        <Col xs={4}>
          <FormControl componentClass="select"
            value={this.state.width}
            onChange={e => this.handleSetWebviewWidthWithDebounce(e.target.value, false)}
            disabled={!useFixedResolution} >
            <option key={-1} value={this.state.width} hidden>
              {labelText}
            </option>
            {
              [0, 1, 2, 3].map((i) => {
                return (
                  <option key={i} value={(i * 400 + 400)}>
                    {Math.round((i * 400 + 400) / 1200 * 100)}%
                  </option>
                )
              })
            }
          </FormControl>
        </Col>
        <Col id="poi-resolution-config" xs={12} style={{display: 'flex', alignItems: 'center'}}>
          <div style={{flex: 1}}>
            <FormControl type="number"
              value={this.state.width}
              onChange={e => this.handleSetWebviewWidthWithDebounce(e.target.value, true)}
              readOnly={!useFixedResolution} />
          </div>
          <div style={{flex: 'none', width: 15, paddingLeft: 5}}>
            x
          </div>
          <div style={{flex: 1}}>
            <FormControl type="number" value={Math.round(height)} readOnly />
          </div>
          <div style={{flex: 'none', width: 15, paddingLeft: 5}}>
            px
          </div>
        </Col>
      </Grid>
    )
  }
}
