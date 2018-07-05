import { Grid, Col, FormControl, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { get } from 'lodash'
import { Trans } from 'react-i18next'

const { config } = window

@connect((state, props) => ({
  zoomLevel: get(state.config, 'poi.zoomLevel', 1),
  key: get(state.config, 'poi.zoomLevel', 1),
}))
export class ZoomingConfig extends Component {
  static propTypes = {
    zoomLevel: PropTypes.number,
  }
  state = {
    zoomLevel: this.props.zoomLevel,
  }
  handleChangeZoomLevel = (e) => {
    config.set('poi.zoomLevel', this.state.zoomLevel)
  }
  render() {
    return (
      <Grid>
        <Col xs={6}>
          <OverlayTrigger placement='top' overlay={
            <Tooltip id='displayconfig-zoom'><Trans>setting:Zoom level</Trans> <strong>{parseInt(this.state.zoomLevel * 100)}%</strong></Tooltip>
          }>
            <FormControl type="range" onChange={(e) => this.setState({ zoomLevel: parseFloat(e.target.value) })}
              min={0.5} max={4.0} step={0.05} defaultValue={this.state.zoomLevel}
              onMouseUp={this.handleChangeZoomLevel}
              onTouchEnd={this.handleChangeZoomLevel} />
          </OverlayTrigger>
        </Col>
        <Col xs={6}>
          <Trans>setting:Zoom level</Trans> <strong>{parseInt(this.state.zoomLevel * 100)}%</strong>
        </Col>
      </Grid>
    )
  }
}
