import { FormGroup } from '@blueprintjs/core'
import React from 'react'
import { withNamespaces } from 'react-i18next'
import { Section } from 'views/components/settings/components/section'
import { SwitchConfig } from 'views/components/settings/components/switch'

import { SlotCheckConfig } from './slot-check-config'
import { UnusedSlotCheckConfig } from './unused-slot-check-config'

export const PreSortieConfig = withNamespaces(['setting'])(({ t }) => (
  <Section title={t('setting:Pre-Sortie Check')}>
    <SlotCheckConfig type="ship" />
    <SlotCheckConfig type="item" />
    <FormGroup>
      <SwitchConfig
        label={t('setting:Display Event Ship Locking Notification')}
        configName="poi.eventSortieCheck.enable"
        defaultValue={true}
      />
    </FormGroup>
    <FormGroup>
      <SwitchConfig
        label={t('setting:Display Expedition Resupply Notification')}
        configName="poi.expeditionResupplyCheck.enable"
        defaultValue={false}
      />
    </FormGroup>
    <UnusedSlotCheckConfig />
  </Section>
))
