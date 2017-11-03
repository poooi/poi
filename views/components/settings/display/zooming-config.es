import { Grid, Col, FormControl, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { get } from 'lodash'

const {config, i18n} = window
const __ = i18n.setting.__.bind(i18n.setting)

const ZoomingConfig = connect(() => (
  (state, props) => ({
    zoomLevel: get(state.config, 'poi.zoomLevel', 1),
  })
))(class zoomingConfig extends Component {
  static propTypes = {
    zoomLevel: PropTypes.number,
  }
  state = {
    zoomLevel: config.get('poi.zoomLevel', 1),
  }
  handleChangeZoomLevel = (e) => {
    config.set('poi.zoomLevel', this.state.zoomLevel)
  }
  componentWillReceiveProps = (nextProps) => {
    if (this.state.zoomLevel !== nextProps.zoomLevel) {
      this.setState({
        zoomLevel: nextProps.zoomLevel,
      })
    }
  }
  render() {
    return (
      <Grid>
        <Col xs={6}>
          <OverlayTrigger placement='top' overlay={
            <Tooltip id='displayconfig-zoom'>{__('Zoom level')} <strong>{parseInt(this.state.zoomLevel * 100)}%</strong></Tooltip>
          }>
            <FormControl type="range" onInput={(e) => this.setState({ zoomLevel: parseFloat(e.target.value) })}
              min={0.5} max={4.0} step={0.05} defaultValue={this.state.zoomLevel}
              onMouseUp={this.handleChangeZoomLevel}
              onTouchEnd={this.handleChangeZoomLevel} />
          </OverlayTrigger>
        </Col>
        <Col xs={6}>
          {__('Zoom level')} <strong>{parseInt(this.state.zoomLevel * 100)}%</strong>
        </Col>
      </Grid>
    )
  }
})


export default ZoomingConfig
