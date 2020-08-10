import React from 'react'
import { withNamespaces } from 'react-i18next'
import { FormGroup } from '@blueprintjs/core'

import { SwitchConfig } from 'views/components/settings/components/switch'
import { Section } from 'views/components/settings/components/section'
import { SlotCheckConfig } from './slot-check-config'

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
  </Section>
))
