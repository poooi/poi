import React, { Component } from 'react'
import { Switch } from '@blueprintjs/core'
import i18next from 'views/env-parts/i18next'
import ReactMarkdown from 'react-remarkable'

const { config, POI_VERSION, dbg } = window

// Readme contents
const dontShowAgain = () =>
  config.set('poi.update.lastversion', POI_VERSION)

class GoogleAnalyticsOption extends Component {
  state = {
    checked: config.get('poi.misc.analytics', true),
  }
  handleChange = e => {
    config.set('poi.misc.analytics', !this.state.checked)
    this.setState({ checked: !this.state.checked })
  }
  render() {
    return (
      <Switch
        checked={this.state.checked}
        onChange={this.handleChange}>
        {i18next.t('setting:Send data to Google Analytics')}
      </Switch>
    )
  }
}

const title = 'README'
const content =
    <div>
      <ReactMarkdown source={i18next.t('others:welcome_markdown', { version: POI_VERSION })} />
      <div>
        <GoogleAnalyticsOption />
      </div>
    </div>
const footer = [
  {
    name: i18next.t('I know'),
    func: dontShowAgain,
    style: 'success',
  },
]

const toggle = () => window.toggleModal(title, content, footer)

// using setTimeout to avoid disturbing the magic being cast in layout.es
if (config.get('poi.update.lastversion', '0.0.0') != POI_VERSION) {
  setTimeout(toggle, 5000)
}

if (window.dbg?.isEnabled?.()) {
  window.toggleWelcomeDialog = toggle
}
