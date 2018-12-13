/* global config */
import React, { useState, useCallback } from 'react'
import { withNamespaces } from 'react-i18next'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { compose } from 'redux'

import { Slider, FormGroup } from '@blueprintjs/core'

import { Wrapper, HalfWrapper } from 'views/components/settings/components/section'
import { SwitchConfig } from 'views/components/settings/components/switch'

const handleChangeLimit = value => {
  config.set('poi.misc.limitFps.value', parseInt(value))
}

export const LimitFps = compose(
  withNamespaces(['setting']),
  connect(state => get(state.config, 'poi.misc.limitFps')),
)(({ t, enabled, value }) => {
  const [fps, setFps] = useState(value)

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
            onChange={v => setFps(v)}
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
})
