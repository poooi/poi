/* global config */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { Slider } from '@blueprintjs/core'
import { withNamespaces } from 'react-i18next'

import { Section } from 'views/components/settings/components/section'

@withNamespaces(['setting'])
@connect((state, props) => ({
  zoomLevel: get(state.config, 'poi.appearance.zoom', 1),
  key: get(state.config, 'poi.appearance.zoom', 1),
}))
export class ZoomingConfig extends Component {
  static propTypes = {
    zoomLevel: PropTypes.number,
  }

  state = {
    zoomLevel: this.props.zoomLevel,
  }

  handleChangeZoomLevel = (value) => {
    this.setState({
      zoomLevel: value,
    })
  }

  handleSaveZoomLevel = (value) => {
    config.set('poi.appearance.zoom', this.state.zoomLevel)
  }

  render() {
    const { t } = this.props
    return (
      <Section title={t('Zoom')}>
        <Slider
          onChange={this.handleChangeZoomLevel}
          onRelease={this.handleSaveZoomLevel}
          min={0.5}
          max={4.0}
          stepSize={0.05}
          labelRenderer={(value) => `${Math.round(value * 100)}%`}
          value={this.state.zoomLevel}
        />
      </Section>
    )
  }
}
