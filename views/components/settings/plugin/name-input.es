import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { FormControl, ControlLabel, InputGroup, FormGroup, Button } from 'react-bootstrap'
import { trim } from 'lodash'
import validate from 'validate-npm-package-name'
import { translate } from 'react-i18next'

@translate(['setting'])
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
    const { t } = this.props
    const validPackageName = manuallyInstallPackage.length > 0 &&
      /^poi-plugin-.*$/.test(manuallyInstallPackage) &&
      validate(manuallyInstallPackage).validForNewPackages
    return (
      <FormGroup>
        <ControlLabel>{t('setting:Install directly from npm')}</ControlLabel>
        <InputGroup bsSize='small'>
          <FormControl type="text"
            value={this.state.manuallyInstallPackage}
            onChange={this.changeInstalledPackage}
            label={t('setting:Install directly from npm')}
            disabled={this.props.manuallyInstallStatus === 1 || this.props.npmWorking}
            placeholder={t('setting:Input plugin package name') + '...'}>
          </FormControl>
          <InputGroup.Button>
            <Button bsStyle='primary'
              disabled={this.props.manuallyInstallStatus === 1 ||
                      this.props.npmWorking ||
                      !validPackageName}
              onClick={this.props.handleManuallyInstall.bind(null, this.state.manuallyInstallPackage)}>
              {t('setting:Install')}
            </Button>
          </InputGroup.Button>
        </InputGroup>
      </FormGroup>
    )
  }
}
