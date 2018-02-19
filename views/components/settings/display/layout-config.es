import { Grid, Col, Button, ButtonGroup, Checkbox } from 'react-bootstrap'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { get } from 'lodash'
import { Trans } from 'react-i18next'

const { config } = window

@connect((state, props) => ({
  layout: get(state.config, 'poi.layout', 'horizontal'),
  enableDoubleTabbed: get(state.config, 'poi.tabarea.double', false),
  reversed: get(state.config, 'poi.reverseLayout', false),
}))
export class LayoutConfig extends Component {
  static propTypes = {
    enableDoubleTabbed: PropTypes.bool,
    layout: PropTypes.string,
  }
  handleSetLayout = (layout, rev) => {
    config.set('poi.layout', layout)
    config.set('poi.reverseLayout', rev)
  }
  handleSetDoubleTabbed = () => {
    config.set('poi.tabarea.double', !this.props.enableDoubleTabbed)
  }
  render() {
    const leftActive = this.props.layout === 'horizontal' && this.props.reversed
    const downActive = this.props.layout !== 'horizontal' && !this.props.reversed
    const upActive = this.props.layout !== 'horizontal' && this.props.reversed
    const rightActive = this.props.layout === 'horizontal' && !this.props.reversed
    return (
      <Grid>
        <Col xs={12}>
          <ButtonGroup>
            <Button bsStyle={leftActive ? 'success' : 'danger'}
              onClick={e => this.handleSetLayout('horizontal', true)}>
              <a className="layout-button layout-side" style={{ transform: 'scaleX(-1)' }} />
            </Button>
            <Button bsStyle={downActive ? 'success' : 'danger'}
              onClick={e => this.handleSetLayout('vertical', false)}>
              <a className="layout-button layout-land" />
            </Button>
            <Button bsStyle={upActive ? 'success' : 'danger'}
              onClick={e => this.handleSetLayout('vertical', true)}>
              <a className="layout-button layout-land" style={{ transform: 'scaleY(-1)' }} />
            </Button>
            <Button bsStyle={rightActive ? 'success' : 'danger'}
              onClick={e => this.handleSetLayout('horizontal', false)}>
              <a className="layout-button layout-side" />
            </Button>
          </ButtonGroup>
        </Col>
        <Col xs={12}>
          <Checkbox checked={this.props.enableDoubleTabbed} onChange={this.handleSetDoubleTabbed}>
            <Trans>setting:Split component and plugin panel</Trans>
          </Checkbox>
        </Col>
      </Grid>
    )
  }
}
