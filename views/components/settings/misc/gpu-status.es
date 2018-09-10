import React, { PureComponent } from 'react'
import { remote } from 'electron'
import { Button } from 'react-bootstrap'
import { translate } from 'react-i18next'
import Webview from 'react-electron-web-view'

@translate(['setting'])
export class GPUStatus extends PureComponent {
  getGPUFeatureStatus = remote.require('electron').app.getGPUFeatureStatus

  handleClick = () => {
    const { t } = this.props
    const content = <div>
      <Webview src="chrome://gpu" className="gpu-stat-view" />
    </div>

    window.toggleModal(t('setting:GPU Status'), content)
  }

  render() {
    const { t } = this.props
    return (
      <Button onClick={this.handleClick}>
        {t('setting:GPU Status')}
      </Button>
    )
  }
}
