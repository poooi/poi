import { Grid, Col, FormControl } from 'react-bootstrap'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { get } from 'lodash'

const {config } = window

@connect((state, props) => ({
  flashQuality: get(state.config, 'poi.flashQuality', 'high'),
  flashWindowMode: get(state.config, 'poi.flashWindowMode', 'window'),
}))
export class FlashQualityConfig extends Component {
  static propTypes = {
    flashQuality: PropTypes.string,
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
}
