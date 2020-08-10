/* global config, POI_VERSION */
import React, { Component } from 'react'
import { Switch, Tabs, Tab } from '@blueprintjs/core'
import ReactMarkdown from 'react-remarkable'

import { useTranslation, withTranslation, Trans } from 'react-i18next'
import { ResolutionConfig } from 'views/components/settings/display/resolution-config'
import { ProxiesConfig } from 'views/components/settings/network'

// Readme contents
const dontShowAgain = () => config.set('poi.update.lastversion', POI_VERSION)

@withTranslation()
class GoogleAnalyticsOption extends Component {
  state = {
    checked: config.get('poi.misc.analytics', true),
  }
  handleChange = e => {
    config.set('poi.misc.analytics', !this.state.checked)
    this.setState({ checked: !this.state.checked })
  }
  render() {
    const { t } = this.props
    return (
      <Switch checked={this.state.checked} onChange={this.handleChange}>
        {t('setting:Send data to Google Analytics')}
      </Switch>
    )
  }
}

const WelcomeMessage = () => {
  const { t } = useTranslation()
  return (
    <div>
      <ReactMarkdown source={t('others:welcome_markdown', { version: POI_VERSION })} />
      <div>
        <GoogleAnalyticsOption />
      </div>
    </div>
  )
}

const QuickSettings = () => (
  <div>
    <ResolutionConfig />
    <ProxiesConfig />
  </div>
)

const Content = () => {
  const { t } = useTranslation('others')
  return (
    <Tabs id="welcome-tabs">
      <Tab id="message" title={t('Message from poi team')} panel={<WelcomeMessage />} />
      <Tab id="quick-settings" title={t('Quick settings')} panel={<QuickSettings />} />
    </Tabs>
  )
}

const footer = [
  {
    name: <Trans>others:OK</Trans>,
    func: dontShowAgain,
    style: 'success',
  },
]

const toggle = () => window.toggleModal(<Trans>others:Welcome</Trans>, <Content />, footer)

// using setTimeout to avoid disturbing the magic being cast in layout.es
if (config.get('poi.update.lastversion', '0.0.0') != POI_VERSION) {
  setTimeout(toggle, 5000)
}

if (window.dbg?.isEnabled?.()) {
  window.toggleWelcomeDialog = toggle
}
