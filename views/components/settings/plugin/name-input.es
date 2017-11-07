import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { FormControl, ControlLabel, InputGroup, FormGroup, Button } from 'react-bootstrap'
import { get } from 'lodash'

const __ = window.i18n.setting.__.bind(window.i18n.setting)

export default class NameInput extends PureComponent {
  static propTypes = {
    handleManuallyInstall: PropTypes.func,
    manuallyInstallStatus: PropTypes.number,
    npmWorking: PropTypes.bool,
  }
  state = {
    manuallyInstallPackage: '',
  }
  changeInstalledPackage = (e) => {
    this.setState({manuallyInstallPackage: e.target.value})
  }
  validPackageName = () => {
    return get(this.state, 'manuallyInstallPackage.length', 0) > 0 &&
      /^\s*(poi-plugin-\S+)\s*$/.exec(this.state.manuallyInstallPackage)
  }
  render() {
    const pkgNameMatchResult = this.validPackageName()
    const installDisabled =
      this.props.manuallyInstallStatus === 1 ||
      this.props.npmWorking ||
      !pkgNameMatchResult

    return (
      <FormGroup>
        <ControlLabel>{__('Install directly from npm')}</ControlLabel>
        <InputGroup bsSize='small'>
          <FormControl type="text"
            value={this.state.manuallyInstallPackage}
            onChange={this.changeInstalledPackage}
            label={__('Install directly from npm')}
            disabled={this.props.manuallyInstallStatus === 1 || this.props.npmWorking}
            placeholder={__('Input plugin package name...')}>
          </FormControl>
          <InputGroup.Button>
            <Button
              bsStyle='primary'
              disabled={installDisabled}
              onClick={
                installDisabled ?
                  null :
                  this.props.handleManuallyInstall.bind(pkgNameMatchResult[1])
              }
            >
              {__('Install')}
            </Button>
          </InputGroup.Button>
        </InputGroup>
      </FormGroup>
    )
  }
}
