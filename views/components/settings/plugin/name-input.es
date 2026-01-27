import { FormGroup, ControlGroup, InputGroup, Button, Intent } from '@blueprintjs/core'
import { trim, last } from 'lodash'
import npa from 'npm-package-arg'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { withNamespaces } from 'react-i18next'

/**
 * function to check if it is valid poi plugin package
 * @param {string} packageName the package name to validate
 * @returns {boolean}
 */
const validate = (packageName) => {
  if (!packageName) {
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

@withNamespaces(['setting'])
export class NameInput extends PureComponent {
  static propTypes = {
    onInstall: PropTypes.func,
    status: PropTypes.number,
    npmWorking: PropTypes.bool,
  }

  state = {
    packageName: '',
  }

  changeInstalledPackage = (e) => {
    this.setState({ packageName: trim(e.target.value) })
  }

  handleClick = () => {
    this.props.onInstall(this.state.packageName)
  }

  render() {
    const { packageName } = this.state
    const { t } = this.props
    const validPackageName = validate(packageName)
    return (
      <FormGroup label={t('setting:Install directly from npm')}>
        <ControlGroup fill>
          <InputGroup
            type="text"
            value={packageName}
            onChange={this.changeInstalledPackage}
            disabled={this.props.status === 1 || this.props.npmWorking}
            placeholder={t('setting:Input plugin package name') + '...'}
          />
          <Button
            intent={Intent.PRIMARY}
            disabled={this.props.status === 1 || this.props.npmWorking || !validPackageName}
            onClick={this.handleClick}
          >
            {t('setting:Install')}
          </Button>
        </ControlGroup>
      </FormGroup>
    )
  }
}
