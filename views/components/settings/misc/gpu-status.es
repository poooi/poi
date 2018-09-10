import React, { PureComponent } from 'react'
import { remote } from 'electron'
import { Button } from 'react-bootstrap'
import { translate } from 'react-i18next'

@translate(['setting'])
export class GPUStatus extends PureComponent {
  getGPUFeatureStatus = remote.require('electron').app.getGPUFeatureStatus

  handleClick = () => {
    window.open('chrome://gpu', 'plugin[gpuinfo]')
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
