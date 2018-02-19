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
import { Trans } from 'react-i18next'

const { session } = remote.require('electron')

const { config, toggleModal } = window

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
    remote.getCurrentWebContents().session.clearStorageData({storages: ['cookies']}, () => {
      toggleModal(<Trans>setting:Delete cookies</Trans>, <Trans>setting:Success!</Trans>)
    })
  }
  handleClearCache = (e) => {
    remote.getCurrentWebContents().session.clearCache(()=> {
      toggleModal(<Trans>setting:Delete cache</Trans>, <Trans>setting:Success!</Trans>)
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
            <ControlLabel><Trans>setting:Current cache size</Trans></ControlLabel>
            <InputGroup>
              <InputGroup.Button>
                <Button onClick={this.handleUpdateCacheSize}><Trans>setting:Update</Trans></Button>
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
            <ControlLabel><Trans>setting:Maximum cache size</Trans></ControlLabel>
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
            <Trans>setting:Delete cookies</Trans>
          </Button>
        </Col>
        <Col xs={6}>
          <Button bsStyle="danger" onClick={this.handleClearCache} style={{width: '100%'}}>
            <Trans>setting:Delete cache</Trans>
          </Button>
        </Col>
        <Col xs={12}>
          <Alert bsStyle='warning' style={{marginTop: '10px'}}>
            <Trans>setting:If connection error occurs frequently, delete both of them</Trans>
          </Alert>
        </Col>
      </Grid>
    )
  }
}
