import { Grid, Col, FormControl, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { get } from 'lodash'

const {config, i18n } = window
const __ = i18n.setting.__.bind(i18n.setting)

const PanelMinSizeConfig = connect(() => (
  (state, props) => ({
    panelMinSize: get(state.config, 'poi.panelMinSize', 1),
    layout: get(state.config, 'poi.layout', 'horizontal'),
  })
))(class PanelMinSizeConfig extends Component {
  static propTypes = {
    panelMinSize: PropTypes.number,
    layout: PropTypes.string,
  }
  state = {
    panelMinSize: config.get('poi.panelMinSize', 1),
  }
  handleChangePanelMinSize = (e) => {
    config.set('poi.panelMinSize', this.state.panelMinSize)
  }
  componentWillReceiveProps = (nextProps) => {
    if (this.state.panelMinSize !== nextProps.panelMinSize) {
      this.setState({
        panelMinSize: nextProps.panelMinSize,
      })
    }
  }
  render() {
    const configName = this.props.layout == 'horizontal' ? 'Minimal width' : 'Minimal height'
    return (
      <Grid>
        <Col xs={6}>
          <OverlayTrigger placement='top' overlay={
            <Tooltip id='displayconfig-panel-size'>{__(configName)} <strong>{parseInt(this.state.panelMinSize * 100)}%</strong></Tooltip>
          }>
            <FormControl type="range" onInput={(e) => this.setState({ panelMinSize: parseFloat(e.target.value) })}
              min={1.0} max={2.0} step={0.05} defaultValue={this.state.panelMinSize}
              onMouseUp={this.handleChangePanelMinSize}
              onTouchEnd={this.handleChangePanelMinSize} />
          </OverlayTrigger>
        </Col>
        <Col xs={6}>
          {__(configName)} <strong>{parseInt(this.state.panelMinSize * 100)}%</strong>
        </Col>
      </Grid>
    )
  }
})

export default PanelMinSizeConfig
