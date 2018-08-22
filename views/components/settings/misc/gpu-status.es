import React, { PureComponent } from 'react'
import { remote } from 'electron'
import { Button, Table } from 'react-bootstrap'
import { entries, map } from 'lodash'
import { translate } from 'react-i18next'

@translate(['setting'])
export class GPUStatus extends PureComponent {
  getGPUFeatureStatus = remote.require('electron').app.getGPUFeatureStatus

  handleClick = () => {
    const { t } = this.props
    const status = this.getGPUFeatureStatus()

    const content = <Table striped bordered hover>
      <thead>
        <tr>
          <th>{t('setting:Feature')}</th>
          <th><th>{t('setting:Status')}</th></th>
        </tr>
      </thead>
      <tbody>
        {
          map(entries(status), ([key, value]) =>
            <tr key={key}>
              <td>{key}</td>
              <td>{value}</td>
            </tr>
          )
        }
      </tbody>
    </Table>

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
