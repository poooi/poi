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
    const gpuWindow = open(fileUrl(path.join(ROOT, 'index-plugin.html')), 'plugin[gpuinfo]')
    gpuWindow.addEventListener('DOMContentLoaded', () => {
      const div = gpuWindow.document.createElement('div')
      const color = window.isDarkTheme ? '#3d3d3d' : 'white'
      div.style.height = '100%'
      div.innerHTML =
        '<webview src="chrome://gpu" style="width: 100%; height: 100%" webpreferences="transparent=yes" />'
      gpuWindow.document.body.style.height = '100vh'
      gpuWindow.document.body.style.margin = 0
      gpuWindow.document.body.style.backgroundColor = color
      gpuWindow.document.body.appendChild(div)
    })
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
