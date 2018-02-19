import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { FormControl, ControlLabel, InputGroup, FormGroup, Button } from 'react-bootstrap'
import { trim } from 'lodash'
import validate from 'validate-npm-package-name'
import { Trans } from 'react-i18next'
import i18next from 'views/env-parts/i18next'

export class NameInput extends PureComponent {
  static propTypes = {
    handleManuallyInstall: PropTypes.func,
    manuallyInstallStatus: PropTypes.number,
    npmWorking: PropTypes.bool,
  }
  state = {
    manuallyInstallPackage: '',
  }
  changeInstalledPackage = (e) => {
    this.setState({manuallyInstallPackage: trim(e.target.value)})
  }
  render() {
    const { manuallyInstallPackage } = this.state
    const validPackageName = manuallyInstallPackage.length > 0 &&
      /^poi-plugin-.*$/.test(manuallyInstallPackage) &&
      validate(manuallyInstallPackage).validForNewPackages
    return (
      <FormGroup>
        <ControlLabel><Trans>setting:Install directly from npm</Trans></ControlLabel>
        <InputGroup bsSize='small'>
          <FormControl type="text"
            value={this.state.manuallyInstallPackage}
            onChange={this.changeInstalledPackage}
            label={<Trans>setting:Install directly from npm</Trans>}
            disabled={this.props.manuallyInstallStatus === 1 || this.props.npmWorking}
            placeholder={i18next.t('setting:Input plugin package name') + '...'}>
          </FormControl>
          <InputGroup.Button>
            <Button bsStyle='primary'
              disabled={this.props.manuallyInstallStatus === 1 ||
                      this.props.npmWorking ||
                      !validPackageName}
              onClick={this.props.handleManuallyInstall.bind(null, this.state.manuallyInstallPackage)}>
              <Trans>setting:Install</Trans>
            </Button>
          </InputGroup.Button>
        </InputGroup>
      </FormGroup>
    )
  }
}
