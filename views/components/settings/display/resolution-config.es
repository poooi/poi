import { Grid, Col, FormControl, Checkbox } from 'react-bootstrap'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { debounce } from 'lodash'
import { Trans } from 'react-i18next'

const { config } = window

const ResolutionConfig = connect((state, props) => ({
  webview: state.layout.webview,
}))(class ResolutionConfig extends Component {
  static propTypes = {
    webview: PropTypes.object,
  }
  state = {
    width: this.props.webview.width,
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
    const useFixedResolution = this.props.webview.useFixedResolution
    const width = parseInt(value)
    if (isNaN(width) || width < 0 || !useFixedResolution) {
      return
    }
    config.set('poi.webview.width', width)
  }
  handleSetFixedResolution = (e) => {
    if (this.props.webview.useFixedResolution) {
      config.set('poi.webview.width', -1)
    } else {
      config.set('poi.webview.width', Math.round(this.props.webview.width))
    }
  }
  componentWillReceiveProps = (nextProps) => {
    if (this.state.width !== nextProps.webview.width) {
      this.setState({
        width: nextProps.webview.width,
      })
    }
  }
  render() {
    return (
      <Grid>
        <Col xs={8}>
          <Checkbox
            checked={!this.props.webview.useFixedResolution}
            onChange={this.handleSetFixedResolution}>
            <Trans>setting:Adaptive resolution based on the window</Trans>
          </Checkbox>
        </Col>
        <Col xs={4}>
          <FormControl componentClass="select"
            value={this.state.width}
            onChange={e => this.handleSetWebviewWidthWithDebounce(e.target.value, false)}
            disabled={!this.props.webview.useFixedResolution} >
            <option key={-1} value={this.state.width} hidden>
              {Math.round(this.props.webview.width / 800 * 100)}%
            </option>
            {
              [0, 1, 2, 3].map((i) => {
                return (
                  <option key={i} value={(i * 400 + 400)}>
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
              value={this.state.width}
              onChange={e => this.handleSetWebviewWidthWithDebounce(e.target.value, true)}
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

export default ResolutionConfig
