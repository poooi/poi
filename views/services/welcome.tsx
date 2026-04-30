import type { ButtonData } from 'views/components/etc/modal'

import { Tabs, Tab } from '@blueprintjs/core'
import { map } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-remarkable'
import { SwitchConfig } from 'views/components/settings/components/switch'
import { ResolutionConfig } from 'views/components/settings/display/resolution-config'
import { ProxiesConfig } from 'views/components/settings/network'
import { config } from 'views/env-parts/config'
import i18next from 'views/env-parts/i18next'
import { toggleModal } from 'views/env-parts/modal'

const dontShowAgain = () => config.set('poi.update.lastversion', window.POI_VERSION)

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
      <ReactMarkdown
        source={String(t('others:welcome_markdown', { version: window.POI_VERSION }))}
      />
      <div>
        {map(SWITCHES, ({ label, configName, defaultValue }) => (
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
      <Tab id="message" title={String(t('Message from poi team'))} panel={<WelcomeMessage />} />
      <Tab id="quick-settings" title={String(t('Quick settings'))} panel={<QuickSettings />} />
    </Tabs>
  )
}

const footer: ButtonData[] = [
  {
    name: String(i18next.t('others:OK')),
    func: dontShowAgain,
    style: 'success',
  },
]

export const toggleWelcomeDialog = () =>
  toggleModal(String(i18next.t('others:Welcome')), <Content />, footer)

// using setTimeout to avoid disturbing the magic being cast in layout.ts
if ((config.get('poi.update.lastversion', '0.0.0') as string) != window.POI_VERSION) {
  setTimeout(toggleWelcomeDialog, 5000)
}

declare global {
  interface Window {
    /** @deprecated Use `import { toggleWelcomeDialog } from 'views/services/welcome'` instead */
    toggleWelcomeDialog: () => void
  }
}

if (window.dbg?.isEnabled?.()) {
  window.toggleWelcomeDialog = toggleWelcomeDialog
}
