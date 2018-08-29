import { Grid, Col, Button, ButtonGroup } from 'react-bootstrap'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { get } from 'lodash'
import i18next from 'views/env-parts/i18next'

const { config, toggleModal } = window

@connect((state, props) => ({
  layout: get(state.config, 'poi.layout', 'horizontal'),
  enableDoubleTabbed: get(state.config, 'poi.tabarea.double', false),
  verticalDoubleTabbed: get(state.config, 'poi.tabarea.vertical', false),
  reversed: get(state.config, 'poi.reverseLayout', false),
  isolateGameWindow: get(state.config, 'poi.isolateGameWindow', false),
}))
export class LayoutConfig extends Component {
  static propTypes = {
    enableDoubleTabbed: PropTypes.bool,
    layout: PropTypes.string,
    reversed: PropTypes.bool,
    isolateGameWindow: PropTypes.bool,
  }
  createConfirmModal = callback => {
    const title = i18next.t('setting:Apply changes')
    // react-remarkable uses remarkable as parser，
    // remarkable disables HTML by default，
    // react-remarkable's default option dose not enable HTML，
    // it could be considered safe
    const content = i18next.t('setting:Game page will be refreshed')
    const footer = [
      {
        name: i18next.t('others:Confirm'),
        func: callback,
        style: 'warning',
      },
    ]
    toggleModal(title, content, footer)
  }
  handleSetLayout = (layout, rev) => {
    if (this.props.isolateGameWindow) {
      this.createConfirmModal(() => this.setLayout(layout, rev))
    } else {
      this.setLayout(layout, rev)
    }
  }
  setLayout = (layout, rev) => {
    if (this.props.isolateGameWindow) {
      this.setIsolateGameWindow(false)
    }
    config.set('poi.layout', layout)
    config.set('poi.reverseLayout', rev)
  }
  handleSetIsolateGameWindow = () => {
    if (!this.props.isolateGameWindow) {
      this.createConfirmModal(e => this.setIsolateGameWindow(true))
    }
  }
  setIsolateGameWindow = flag => {
    config.set('poi.isolateGameWindow', flag)
  }
  handleSetDoubleTabbed = (doubleTabbed, vertical) => {
    config.set('poi.tabarea.double', doubleTabbed)
    if (doubleTabbed) {
      config.set('poi.tabarea.vertical', vertical)
    }
  }
  render() {
    const { layout, reversed, isolateGameWindow, enableDoubleTabbed, verticalDoubleTabbed } = this.props
    const leftActive = !isolateGameWindow && layout === 'horizontal' && reversed
    const downActive = !isolateGameWindow && layout !== 'horizontal' && !reversed
    const upActive = !isolateGameWindow && layout !== 'horizontal' && reversed
    const rightActive = !isolateGameWindow && layout === 'horizontal' && !reversed
    return (
      <Grid>
        <Col xs={12}>
          <ButtonGroup>
            <Button bsStyle={rightActive ? 'success' : 'danger'}
              onClick={e => this.handleSetLayout('horizontal', false)}>
              <a className="layout-button layout-side" />
            </Button>
            <Button bsStyle={downActive ? 'success' : 'danger'}
              onClick={e => this.handleSetLayout('vertical', false)}>
              <a className="layout-button layout-land" />
            </Button>
            <Button bsStyle={upActive ? 'success' : 'danger'}
              onClick={e => this.handleSetLayout('vertical', true)}>
              <a className="layout-button layout-land" style={{ transform: 'scaleY(-1)' }} />
            </Button>
            <Button bsStyle={leftActive ? 'success' : 'danger'}
              onClick={e => this.handleSetLayout('horizontal', true)}>
              <a className="layout-button layout-side" style={{ transform: 'scaleX(-1)' }} />
            </Button>
          </ButtonGroup>
          <ButtonGroup style={{ marginLeft: 25 }}>
            <Button bsStyle={isolateGameWindow ? 'success' : 'danger'}
              onClick={this.handleSetIsolateGameWindow}>
              <a className="layout-button layout-separate" />
            </Button>
          </ButtonGroup>
        </Col>
        <Col xs={12} style={{ marginTop: 10 }}>
          <ButtonGroup>
            <Button bsStyle={!enableDoubleTabbed ? 'success' : 'danger'}
              onClick={e => this.handleSetDoubleTabbed(false)}>
              <a className="layout-button doubletabbed-disable" style={{ transform: 'scaleX(-1)' }} />
            </Button>
            <Button bsStyle={enableDoubleTabbed && !verticalDoubleTabbed ? 'success' : 'danger'}
              onClick={e => this.handleSetDoubleTabbed(true, false)}>
              <a className="layout-button doubletabbed-horizontal" />
            </Button>
            <Button bsStyle={enableDoubleTabbed && verticalDoubleTabbed ? 'success' : 'danger'}
              onClick={e => this.handleSetDoubleTabbed(true, true)}>
              <a className="layout-button doubletabbed-vertical" style={{ transform: 'scaleY(-1)' }} />
            </Button>
          </ButtonGroup>
        </Col>
      </Grid>
    )
  }
}
