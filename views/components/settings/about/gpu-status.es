/* global ROOT */
import React, { PureComponent } from 'react'
import * as remote from '@electron/remote'
import path from 'path-extra'
import { Button, Intent } from '@blueprintjs/core'
import { withNamespaces } from 'react-i18next'

import { Section } from 'views/components/settings/components/section'
import { fileUrl } from 'views/utils/tools'

@withNamespaces(['setting'])
export class GPUStatus extends PureComponent {
  getGPUFeatureStatus = remote.require('electron').app.getGPUFeatureStatus

  handleClick = () => {
    //As of electron 11, the url 'chrome://gpu' is not working.
    window.open(fileUrl(path.join(ROOT, 'index-gpu.html')), 'plugin[gpuinfo]')
  }

  render() {
    const { t } = this.props
    return (
      <Section title={t('setting:GPU')}>
        <Button minimal intent={Intent.PRIMARY} onClick={this.handleClick}>
          {t('setting:GPU Status')}
        </Button>
      </Section>
    )
  }
}
