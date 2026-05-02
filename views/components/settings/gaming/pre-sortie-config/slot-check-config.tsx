import { FormGroup, Switch } from '@blueprintjs/core'
import { get } from 'lodash-es'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { IntegerConfig } from 'views/components/settings/components/integer'
import { Wrapper } from 'views/components/settings/components/section'

interface Props {
  type: 'ship' | 'item'
}

type ConfigState = { config: Record<string, unknown> }

export const SlotCheckConfig = ({ type }: Props) => {
  const { t } = useTranslation('setting')
  const enable = Boolean(
    useSelector((state: ConfigState) =>
      get(state.config, `poi.mapStartCheck.${type}.enable`, false),
    ),
  )

  const handleChange = () => {
    config.set(`poi.mapStartCheck.${type}.enable`, !enable)
  }

  return (
    <Wrapper>
      <FormGroup inline>
        <Switch checked={enable} onChange={handleChange}>
          {t(`setting:${type} slots`)}
        </Switch>
      </FormGroup>
      <FormGroup inline label={t('Threshold')}>
        <IntegerConfig
          clampValueOnBlur
          min={0}
          max={1000}
          configName={`poi.mapStartCheck.${type}.minFreeSlots`}
          defaultValue={0}
          disabled={!enable}
        />
      </FormGroup>
    </Wrapper>
  )
}
