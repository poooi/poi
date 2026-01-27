import { Slider } from '@blueprintjs/core'
import { get } from 'lodash'
import PropTypes from 'prop-types'
/* global config */
import React, { Component } from 'react'
import { withNamespaces } from 'react-i18next'
import { connect } from 'react-redux'
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
      zoomLevel: Math.round(value * 100) / 100,
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
