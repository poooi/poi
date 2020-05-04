import React from 'react'
import { withNamespaces } from 'react-i18next'
import { FormGroup, Position, Tooltip } from '@blueprintjs/core'
import { map, size, includes } from 'lodash'

import { Section, Wrapper, FillAvailable } from 'views/components/settings/components/section'
import { SwitchConfig } from 'views/components/settings/components/switch'

import { ShortcutConfig } from './shortcut-config'
// import { LimitFps } from './limit-fps'

const isMacOS = process.platform === 'darwin'

const SWITCHES = [
  {
    label: 'Disable Hardware Acceleration',
    configName: 'poi.misc.disablehwaccel',
    defaultValue: false,
  },
  {
    label: 'Editing DMM Cookie Region Flag',
    configName: 'poi.misc.dmmcookie',
    defaultValue: false,
  },
  {
    label: 'Prevent DMM Network Change Popup',
    configName: 'poi.misc.disablenetworkalert',
    defaultValue: false,
  },
  {
    label: 'Show network status in notification bar',
    configName: 'poi.misc.networklog',
    defaultValue: true,
  },
  {
    label: 'Create shortcut on startup (Notification may not be working without shortcut)',
    configName: 'poi.misc.shortcut',
    defaultValue: true,
    platform: ['win32'],
  },
  {
    label: 'Enter safe mode on next startup',
    configName: 'poi.misc.safemode',
    defaultValue: false,
  },
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

export const AdvancedConfig = withNamespaces(['setting'])(({ t }) => (
  <Section title={t('Advanced')}>
    <Wrapper>
      <Wrapper>
        <FormGroup inline label={t('setting:Boss key')}>
          {isMacOS ? (
            <ShortcutConfig configName="poi.shortcut.bosskey.macos" defaultValue="Cmd+H" disabled />
          ) : (
            <ShortcutConfig configName="poi.shortcut.bosskey" />
          )}
        </FormGroup>
      </Wrapper>

      <FillAvailable>
        <FormGroup inline>
          <Tooltip
            content={t('setting:Set this in the OS X App Menu')}
            disabled={!isMacOS}
            position={Position.TOP_LEFT}
          >
            <SwitchConfig
              label={t('setting:Confirm before exit')}
              configName="poi.confirm.quit"
              defaultValue={false}
              disabled={isMacOS}
            />
          </Tooltip>
        </FormGroup>
      </FillAvailable>

      {/* <LimitFps /> */}

      {map(
        SWITCHES,
        ({ label, configName, defaultValue, platform }) =>
          (!size(platform) || includes(platform, process.platform)) && (
            <FillAvailable key={configName}>
              <FormGroup inline>
                <SwitchConfig
                  label={t(label)}
                  configName={configName}
                  defaultValue={defaultValue}
                />
              </FormGroup>
            </FillAvailable>
          ),
      )}
    </Wrapper>
  </Section>
))
