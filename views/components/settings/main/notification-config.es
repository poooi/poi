import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get } from 'lodash'
import FontAwesome from 'react-fontawesome'
import {
  Grid,
  Col,
  Row,
  Button,
  ButtonGroup,
  FormControl,
  FormGroup,
  InputGroup,
  OverlayTrigger,
  Tooltip,
  Collapse,
  Well,
} from 'react-bootstrap'
import { translate } from 'react-i18next'

const { config } = window

@translate(['setting'])
@connect((state, props) => ({
  enabled: get(state.config, 'poi.notify.enabled', true),
  expedition: get(state.config, 'poi.notify.expedition.enabled', true),
  expeditionValue: get(state.config, 'poi.notify.expedition.value', 60),
  construction: get(state.config, 'poi.notify.construction.enabled', true),
  repair: get(state.config, 'poi.notify.repair.enabled', true),
  morale: get(state.config, 'poi.notify.morale.enabled', true),
  moraleValue: get(state.config, 'poi.notify.morale.value', 49),
  others: get(state.config, 'poi.notify.others.enabled', true),
  volume: get(state.config, 'poi.notify.volume', 0.8),
}))
export class NotificationConfig extends Component {
  static propTypes = {
    enabled: PropTypes.bool,
  }
  constructor(props) {
    super(props)
    this.state = {
      timeSettingShow: false,
      moraleValue: props.moraleValue,
      expeditionValue: props.expeditionValue,
    }
  }
  handleSetNotify = (path) => {
    if (!path) {
      config.set(`poi.notify.enabled`, !this.props.enabled)
    } else {
      config.set(`poi.notify.${path}.enabled`, !get(this.props, path, true))
    }
  }
  handleChangeNotifyVolume = (e) => {
    let volume = e.target.value
    volume = parseFloat(volume)
    if (isNaN(volume)) {
      return
    }
    config.set('poi.notify.volume', volume)
  }
  handleEndChangeNotifyVolume = (e) => {
    window.notify(null)
  }
  handleSetTimeSettingShow = () => {
    const timeSettingShow = !this.state.timeSettingShow
    this.setState({timeSettingShow})
  }
  selectInput = (id) => {
    document.getElementById(id).select()
  }
  handleSetExpedition = (e) => {
    const value = parseInt(e.target.value) || 0
    if (isNaN(value) || value < 0) {
      return
    }
    this.setState({expeditionValue: value})
  }
  handleSetMorale = (e) => {
    const value = parseInt(e.target.value) || 0
    if (isNaN(value) || value < 0) {
      return
    }
    this.setState({moraleValue: value})
  }
  saveNotifySetting = () => {
    const {moraleValue, expeditionValue} = this.state
    config.set('poi.notify.expedition.value', expeditionValue)
    config.set('poi.notify.morale.value', moraleValue)
    this.setState({timeSettingShow: false})
  }
  render () {
    const { t } = this.props
    return (
      <Grid>
        <Col xs={6}>
          <Button
            bsStyle={this.props.enabled ? 'success' : 'danger'}
            onClick={this.handleSetNotify.bind(this, null)}
            style={{width: '100%'}}>
            {(get(this.props, 'enabled', true)) ? '√ ' : ''}
            {t('setting:Enable notification')}
          </Button>
        </Col>
        <Col xs={6}>
          <OverlayTrigger placement='top' overlay={
            <Tooltip id='poiconfig-volume'>{t('setting:Volume')} <strong>{parseInt(this.props.volume * 100)}%</strong></Tooltip>
          }>
            <FormControl type="range"
              onChange={this.handleChangeNotifyVolume} onMouseUp={this.handleEndChangeNotifyVolume}
              min={0.0} max={1.0} step={0.05} defaultValue={this.props.volume} />
          </OverlayTrigger>
        </Col>
        <Col xs={12} style={{marginTop: 10}}>
          <ButtonGroup style={{display: 'flex'}}>
            <Button bsStyle={this.props.construction ? 'success' : 'danger'}
              onClick={this.handleSetNotify.bind(this, 'construction')}
              className='notif-button'>
              {t('setting:Construction')}
            </Button>
            <Button bsStyle={this.props.expedition ? 'success' : 'danger'}
              onClick={this.handleSetNotify.bind(this, 'expedition')}
              className='notif-button'>
              {t('setting:Expedition')}
            </Button>
            <Button bsStyle={this.props.repair ? 'success' : 'danger'}
              onClick={this.handleSetNotify.bind(this, 'repair')}
              className='notif-button'>
              {t('setting:Docking')}
            </Button>
            <Button bsStyle={this.props.morale ? 'success' : 'danger'}
              onClick={this.handleSetNotify.bind(this, 'morale')}
              className='notif-button'>
              {t('setting:Morale')}
            </Button>
            <Button bsStyle={this.props.others ? 'success' : 'danger'}
              onClick={this.handleSetNotify.bind(this, 'others')}
              className='notif-button'>
              {t('setting:Others')}
            </Button>
            <Button onClick={this.handleSetTimeSettingShow} bsStyle='primary' style={{width: 40}}>
              <FontAwesome name={this.state.timeSettingShow ? 'angle-up' : 'angle-down'} />
            </Button>
          </ButtonGroup>
          <Collapse in={this.state.timeSettingShow}>
            <Well>
              <Row>
                <Col xs={9} className='notif-container'>
                  <div className='notif-input-desc'>{t('setting:Expedition')}: {t('setting:Notify when expedition returns in')}</div>
                </Col>
                <Col xs={3} className='notif-container'>
                  <FormGroup>
                    <InputGroup bsSize='small'>
                      <FormControl type="number" id="expeditionValue"
                        disabled={!this.props.expedition}
                        onChange={this.handleSetExpedition}
                        value={this.state.expeditionValue}
                        onClick={this.selectInput.bind(this, "expeditionValue")}
                        className='notif-input' />
                      <InputGroup.Addon>S</InputGroup.Addon>
                    </InputGroup>
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col xs={9} className='notif-container'>
                  <div className='notif-input-desc'>{t('setting:Morale')}: {t('setting:Notify when morale is greater than')}</div>
                </Col>
                <Col xs={3} className='notif-container'>
                  <InputGroup bsSize='small'>
                    <FormControl type="number" id="moraleValue"
                      disabled={!this.props.morale}
                      onChange={this.handleSetMorale}
                      value={this.state.moraleValue}
                      onClick={this.selectInput.bind(this, "moraleValue")}
                      className='notif-input' />
                  </InputGroup>
                </Col>
              </Row>
              <Row>
                <Col xs={2} xsOffset={10}>
                  <Button bsSize='small' onClick={this.saveNotifySetting}>{t('setting:Save')}</Button>
                </Col>
              </Row>
            </Well>
          </Collapse>
        </Col>
      </Grid>
    )
  }
}
