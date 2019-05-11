/* global config, POI_VERSION */
import React, { Component } from 'react'
import { Switch, Tabs, Tab } from '@blueprintjs/core'
import ReactMarkdown from 'react-remarkable'

import i18next from 'views/env-parts/i18next'
import { ResolutionConfig } from 'views/components/settings/display/resolution-config'
import { ProxiesConfig } from 'views/components/settings/network'

// Readme contents
const dontShowAgain = () => config.set('poi.update.lastversion', POI_VERSION)

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
      <Switch checked={this.state.checked} onChange={this.handleChange}>
        {i18next.t('setting:Send data to Google Analytics')}
      </Switch>
    )
  }
}

const WelcomeMessage = () => (
  <div>
    <ReactMarkdown source={i18next.t('others:welcome_markdown', { version: POI_VERSION })} />
    <div>
      <GoogleAnalyticsOption />
    </div>
  </div>
)

const QuickSettings = () => (
  <div>
    <ResolutionConfig />
    <ProxiesConfig />
  </div>
)

const content = (
  <Tabs id="welcome-tabs">
    <Tab id="message" title={i18next.t('Message from poi team')} panel={<WelcomeMessage />} />
    <Tab id="quick-settings" title={i18next.t('Quick Settings')} panel={<QuickSettings />} />
  </Tabs>
)

const footer = [
  {
    name: i18next.t('OK'),
    func: dontShowAgain,
    style: 'success',
  },
]

const toggle = () => window.toggleModal(i18next.t('others:Welcome'), content, footer)

// using setTimeout to avoid disturbing the magic being cast in layout.es
if (config.get('poi.update.lastversion', '0.0.0') != POI_VERSION) {
  setTimeout(toggle, 5000)
}

if (window.dbg?.isEnabled?.()) {
  window.toggleWelcomeDialog = toggle
}
