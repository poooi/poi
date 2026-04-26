import { HTMLSelect } from '@blueprintjs/core'
import { get, map } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { styled } from 'styled-components'

import { Section } from '../components/section'

const list = [
  'none',
  'protanopia',
  'protanomaly',
  'deuteranopia',
  'deuteranomaly',
  'tritanopia',
  'tritanomaly',
  'achromatopsia',
  'achromatomaly',
]

const Select = styled(HTMLSelect)`
  margin-left: 8px;
`

type ConfigState = { config: Record<string, unknown> }

export const AccessibilityConfig = () => {
  const { t } = useTranslation('setting')
  const value = String(
    useSelector((state: ConfigState) =>
      get(state.config, 'poi.appearance.colorblindFilter', 'null'),
    ),
  )

  const handleSetFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    config.set('poi.appearance.colorblindFilter' as never, e.currentTarget.value as never)
  }

  return (
    <Section title={t('Accessibility')}>
      {t('Color blind mode')}
      <Select value={value} onChange={handleSetFilter}>
        {map(list, (mode) => (
          <option value={mode} key={mode}>
            {t(`setting:${mode}`)}
          </option>
        ))}
      </Select>
    </Section>
  )
}
