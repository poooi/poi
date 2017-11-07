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
      /^(poi-plugin-\S+)$/.exec(this.state.manuallyInstallPackage)
  }
  render() {
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
            {
              (() => {
                const matchResult = this.validPackageName()
                return (
                  <Button
                    bsStyle='primary'
                    disabled={
                      this.props.manuallyInstallStatus === 1 ||
                      this.props.npmWorking ||
                      !matchResult
                    }
                    onClick={
                      matchResult ?
                        this.props.handleManuallyInstall.bind(null, matchResult[1]) :
                        null
                    }
                  >
                    {__('Install')}
                  </Button>
                )
              })()
            }
          </InputGroup.Button>
        </InputGroup>
      </FormGroup>
    )
  }
}
