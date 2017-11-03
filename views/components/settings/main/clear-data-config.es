import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { remote } from 'electron'
import {
  Grid,
  Col,
  Button,
  FormControl,
  FormGroup,
  InputGroup,
  ControlLabel,
  Alert,
} from 'react-bootstrap'

const { session } = remote.require('electron')

const { config, toggleModal, i18n } = window
const __ = i18n.setting.__.bind(i18n.setting)

const ClearDataConfig = connect(state => ({
  cacheSize: get(state.config, 'poi.cacheSize', 320),
}))(class ClearDataConfig extends Component {
  static propTypes = {
    cacheSize: PropTypes.number,
  }
  state = {
    cacheSize: 0,
  }
  handleClearCookie = (e) => {
    remote.getCurrentWebContents().session.clearStorageData({storages: ['cookies']}, () => {
      toggleModal(__('Delete cookies'), __('Success!'))
    })
  }
  handleClearCache = (e) => {
    remote.getCurrentWebContents().session.clearCache(()=> {
      toggleModal(__('Delete cache'), __('Success!'))
    })
  }
  handleValueChange = e => {
    config.set('poi.cacheSize', parseInt(e.target.value))
  }
  handleUpdateCacheSize = () => {
    session.defaultSession.getCacheSize(cacheSize => this.setState({ cacheSize }))
  }
  componentDidMount = () => {
    this.handleUpdateCacheSize()
    this.cycle = setInterval(this.handleUpdateCacheSize, 6000000)
  }
  componentWillUnmount = () => {
    if (this.cycle) {
      clearInterval(this.cycle)
    }
  }
  render() {
    return (
      <Grid>
        <Col xs={6}>
          <FormGroup>
            <ControlLabel>{__('Current cache size')}</ControlLabel>
            <InputGroup>
              <InputGroup.Button>
                <Button onClick={this.handleUpdateCacheSize}>{__('Update')}</Button>
              </InputGroup.Button>
              <FormControl type="number"
                disabled
                value={Math.round(this.state.cacheSize / 1048576)}
                className='' />
              <InputGroup.Addon>MB</InputGroup.Addon>
            </InputGroup>
          </FormGroup>
        </Col>
        <Col xs={6}>
          <FormGroup>
            <ControlLabel>{__('Maximum cache size')}</ControlLabel>
            <InputGroup>
              <FormControl type="number"
                onChange={this.handleValueChange}
                value={this.props.cacheSize}
                className='' />
              <InputGroup.Addon>MB</InputGroup.Addon>
            </InputGroup>
          </FormGroup>
        </Col>
        <Col xs={6}>
          <Button bsStyle="danger" onClick={this.handleClearCookie} style={{width: '100%'}}>
            {__('Delete cookies')}
          </Button>
        </Col>
        <Col xs={6}>
          <Button bsStyle="danger" onClick={this.handleClearCache} style={{width: '100%'}}>
            {__('Delete cache')}
          </Button>
        </Col>
        <Col xs={12}>
          <Alert bsStyle='warning' style={{marginTop: '10px'}}>
            {__('If connection error occurs frequently, delete both of them.')}
          </Alert>
        </Col>
      </Grid>
    )
  }
})

export default ClearDataConfig
