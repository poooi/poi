/* global config, POI_VERSION */
import React from 'react'
import { Tabs, Tab } from '@blueprintjs/core'
import ReactMarkdown from 'react-remarkable'
import { map } from 'lodash'
import { useTranslation, Trans } from 'react-i18next'

import { SwitchConfig } from 'views/components/settings/components/switch'
import { ResolutionConfig } from 'views/components/settings/display/resolution-config'
import { ProxiesConfig } from 'views/components/settings/network'

// Readme contents
const dontShowAgain = () => config.set('poi.update.lastversion', POI_VERSION)

const SWITCHES = [
  {
    label: 'Send data to Google Analytics',
    configName: 'poi.misc.analytics',
    defaultValue: true,
  },
  {
    label: 'Send program exceptions to poi team',
    configName: 'poi.misc.exceptionReporting',
    defaultValue: true,
  },
]

const WelcomeMessage = () => {
  const { t } = useTranslation('setting')
  return (
    <div>
      <ReactMarkdown source={t('others:welcome_markdown', { version: POI_VERSION })} />
      <div>
        {map(SWITCHES, ({ label, configName, defaultValue, platform }) => (
          <div key={configName}>
            <SwitchConfig label={t(label)} configName={configName} defaultValue={defaultValue} />
          </div>
        ))}
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
