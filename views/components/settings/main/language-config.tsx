import { HTMLSelect } from '@blueprintjs/core'
import { get, each, map } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import i18next from 'views/env-parts/i18next'

import { Section } from '../components/section'

const setWindowI18nLng = (language: string) => {
  each(i18next.options.ns, (ns) => {
    window.i18n[ns].fixedT = i18next.getFixedT(language, ns)
  })
}

type ConfigState = { config: Record<string, unknown> }

export const LanguageConfig = () => {
  const { t } = useTranslation('setting')
  const value = String(
    useSelector((state: ConfigState) => get(state.config, 'poi.misc.language', window.language)),
  )

  const handleSetLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const language = e.currentTarget.value
    config.set('poi.misc.language', language)
    void i18next.changeLanguage(language)
    setWindowI18nLng(language)
  }

  return (
    <Section title={t('Language')}>
      <HTMLSelect value={value} onChange={handleSetLanguage}>
        {map(window.LOCALES, (lng) => (
          <option value={lng.locale} key={lng.locale}>
            {lng.lng}
          </option>
        ))}
      </HTMLSelect>
    </Section>
  )
}
