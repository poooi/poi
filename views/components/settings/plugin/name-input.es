import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { FormControl, ControlLabel, InputGroup, FormGroup, Button } from 'react-bootstrap'
import { trim, last } from 'lodash'
import npa from 'npm-package-arg'
import { translate } from 'react-i18next'

/**
 * function to check if it is valid poi plugin package
 * @param {string} packageName the package name to validate
 * @returns {boolean}
 */
const validate = packageName => {
  if(!packageName) {
    return false
  }
  let resolved
  try {
    resolved = npa(packageName)
    if (!resolved.registry || !/^poi-plugin-.+$/.test(last(resolved.name.split('/')))) {
      return false
    }
  } catch (e) {
    return false
  }
  return true
}

@translate(['setting'])
export class NameInput extends PureComponent {
  static propTypes = {
    handleManuallyInstall: PropTypes.func,
    manuallyInstallStatus: PropTypes.number,
    npmWorking: PropTypes.bool,
  }
  state = {
    packageName: '',
  }
  changeInstalledPackage = (e) => {
    this.setState({packageName: trim(e.target.value)})
  }
  render() {
    const { packageName } = this.state
    const { t } = this.props
    const validPackageName = validate(packageName)
    return (
      <FormGroup>
        <ControlLabel>{t('setting:Install directly from npm')}</ControlLabel>
        <InputGroup bsSize='small'>
          <FormControl type="text"
            value={packageName}
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
              onClick={this.props.handleManuallyInstall.bind(null, this.state.packageName)}>
              {t('setting:Install')}
            </Button>
          </InputGroup.Button>
        </InputGroup>
      </FormGroup>
    )
  }
}
