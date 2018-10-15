import React from 'react'
import { translate } from 'react-i18next'
import { FormGroup, Position } from '@blueprintjs/core'

import { Section, Wrapper, FillAvailable } from 'views/components/settings/components/section'
import { SwitchConfig } from 'views/components/settings/components/switch'
import { Tooltip } from 'views/components/etc/panel-tooltip'

import { ShortcutConfig } from './shortcut-config'

const isMacOS = process.platform === 'darwin'

export const SystemConfig = translate(['setting'])(({ t }) => (
  <Section title={t('System')}>
    <Wrapper>
      <Wrapper>
        <FormGroup inline label={t('setting:Boss key')}>
          {isMacOS ? (
            <ShortcutConfig defaultValue="Cmd+H" disabled />
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
    </Wrapper>
  </Section>
))
