import React from 'react'
import { remote } from 'electron'
import { translate } from 'react-i18next'
import { FormGroup } from '@blueprintjs/core'

import { Section, Wrapper, FillAvailable } from '../components/section'
import { FolderPickerConfig } from '../components/folder-picker'
import { RadioConfig } from '../components/radio'

const screenshotPathExclude = [window.ROOT]

export const ScreenshotConfig = translate(['setting'])(({ t }) => (
  <Section title={t('Screenshot')}>
    <Wrapper>
      <Wrapper>
        <FormGroup inline label={t('setting:Format')}>
          <RadioConfig
            label={t('setting:Screenshot Format')}
            configName="poi.misc.screenshot.format"
            defaultVal="png"
            availableVal={[{ name: 'PNG', value: 'png' }, { name: 'JPEG', value: 'jpg' }]}
          />
        </FormGroup>
      </Wrapper>

      <FillAvailable>
        <FormGroup inline label={t('setting:Save to')}>
          <FolderPickerConfig
            label={t('setting:Screenshot Folder')}
            configName="poi.misc.screenshot.path"
            defaultVal={remote.getGlobal('DEFAULT_SCREENSHOT_PATH')}
            exclude={screenshotPathExclude}
          />
        </FormGroup>
      </FillAvailable>
    </Wrapper>
  </Section>
))
