import { Slider, FormGroup } from '@blueprintjs/core'
import { get } from 'lodash-es'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Wrapper, HalfWrapper } from 'views/components/settings/components/section'
import { SwitchConfig } from 'views/components/settings/components/switch'

type ConfigState = { config: Record<string, unknown> }

const handleChangeLimit = (value: number) => {
  config.set('poi.misc.limitFps.value', value)
}

export const LimitFps = () => {
  const { t } = useTranslation('setting')
  const storedValue = Number(
    useSelector((state: ConfigState) => get(state.config, 'poi.misc.limitFps.value', 60)),
  )
  const enabled = Boolean(
    useSelector((state: ConfigState) => get(state.config, 'poi.misc.limitFps.enabled', false)),
  )
  const [fps, setFps] = useState(storedValue)

  return (
    <Wrapper>
      <HalfWrapper>
        <FormGroup inline>
          <SwitchConfig
            label={t('Limit max FPS')}
            configName="poi.misc.limitFps.enabled"
            defaultValue={false}
          />
        </FormGroup>
      </HalfWrapper>

      <HalfWrapper>
        <FormGroup inline label={t('Limit')}>
          <Slider
            disabled={!enabled}
            onChange={(v) => setFps(v)}
            onRelease={handleChangeLimit}
            min={30}
            max={120}
            stepSize={5}
            value={fps}
            labelStepSize={30}
          />
        </FormGroup>
      </HalfWrapper>
    </Wrapper>
  )
}
