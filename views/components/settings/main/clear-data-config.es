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
import { translate } from 'react-i18next'
import { remove } from 'fs-extra'
import { join } from 'path'

const { session } = remote.require('electron')

const { config, toggleModal, APPDATA_PATH } = window

@translate(['setting'])
@connect(state => ({
  cacheSize: get(state.config, 'poi.cacheSize', 320),
}))
export class ClearDataConfig extends Component {
  static propTypes = {
    cacheSize: PropTypes.number,
  }
  state = {
    cacheSize: 0,
  }
  handleClearCookie = (e) => {
    remove(join(APPDATA_PATH, 'Cookies')).catch(e => null)
    remove(join(APPDATA_PATH, 'Cookies-journal')).catch(e => null)
    remote.getCurrentWebContents().session.clearStorageData({storages: ['cookies']}, () => {
      toggleModal(this.props.t('setting:Delete cookies'), this.props.t('setting:Success!'))
    })
  }
  handleClearCache = (e) => {
    remote.getCurrentWebContents().session.clearCache(()=> {
      toggleModal(this.props.t('setting:Delete cache'), this.props.t('setting:Success!'))
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
    const { t } = this.props
    return (
      <Grid>
        <Col xs={6}>
          <FormGroup>
            <ControlLabel>{t('setting:Current cache size')}</ControlLabel>
            <InputGroup>
              <InputGroup.Button>
                <Button onClick={this.handleUpdateCacheSize}>{t('setting:Update')}</Button>
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
            <ControlLabel>{t('setting:Maximum cache size')}</ControlLabel>
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
            {t('setting:Delete cookies')}
          </Button>
        </Col>
        <Col xs={6}>
          <Button bsStyle="danger" onClick={this.handleClearCache} style={{width: '100%'}}>
            {t('setting:Delete cache')}
          </Button>
        </Col>
        <Col xs={12}>
          <Alert bsStyle='warning' style={{marginTop: '10px'}}>
            {t('setting:If connection error occurs frequently, delete both of them')}
          </Alert>
        </Col>
      </Grid>
    )
  }
}
