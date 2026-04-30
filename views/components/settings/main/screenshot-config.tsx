import { FormGroup } from '@blueprintjs/core'
import * as remote from '@electron/remote'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ROOT } from 'views/env'

import { FolderPickerConfig } from '../components/folder-picker'
import { RadioConfig } from '../components/radio'
import { Section, Wrapper, FillAvailable } from '../components/section'
import { SwitchConfig } from '../components/switch'

const screenshotPathExclude = [ROOT]
const _rawScreenshotPath = remote.getGlobal('DEFAULT_SCREENSHOT_PATH')
const defaultScreenshotPath = typeof _rawScreenshotPath === 'string' ? _rawScreenshotPath : ''

export const ScreenshotConfig = () => {
  const { t } = useTranslation('setting')
  return (
    <Section title={t('Screenshot')}>
      <Wrapper>
        <Wrapper>
          <FormGroup inline label={t('Format')}>
            <RadioConfig
              configName="poi.misc.screenshot.format"
              defaultValue="png"
              availableVal={[
                { name: 'PNG', value: 'png' },
                { name: 'JPEG', value: 'jpg' },
              ]}
            />
          </FormGroup>
          <SwitchConfig
            label={t('Capture screenshot using canvas directly')}
            configName="poi.misc.screenshot.usecanvas"
            defaultValue={false}
          />
        </Wrapper>

        <FillAvailable>
          <FormGroup inline label={t('Save to')}>
            <FolderPickerConfig
              label={t('Screenshot Folder')}
              configName="poi.misc.screenshot.path"
              defaultValue={defaultScreenshotPath}
              exclude={screenshotPathExclude}
            />
          </FormGroup>
        </FillAvailable>
      </Wrapper>
    </Section>
  )
}
