import { FormGroup } from '@blueprintjs/core'
import { get } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Wrapper } from 'views/components/settings/components/section'
import { SwitchConfig } from 'views/components/settings/components/switch'

type ConfigState = { config: Record<string, unknown> }

export const UnusedSlotCheckConfig = () => {
  const { t } = useTranslation('setting')
  const enable = Boolean(
    useSelector((state: ConfigState) =>
      get(state.config, 'poi.unusedEquipmentSlotCheck.enable', false),
    ),
  )

  return (
    <FormGroup>
      <Wrapper>
        <SwitchConfig
          configName="poi.unusedEquipmentSlotCheck.enable"
          label={t('Display Unused Equipment Slot Notification')}
        />
        <SwitchConfig
          configName="poi.unusedEquipmentSlotCheck.ignoreUnlocked"
          disabled={!enable}
          label={t('Ignore Unlocked Ships')}
        />
      </Wrapper>
    </FormGroup>
  )
}
