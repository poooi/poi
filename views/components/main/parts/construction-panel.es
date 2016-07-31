import { OverlayTrigger, Tooltip, Label } from 'react-bootstrap'
import { join } from 'path-extra'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import { MaterialIcon } from 'views/components/etc/icon'
import { join as joinString, range, get } from 'lodash'
const { ROOT, i18n } = window
const __ = i18n.main.__.bind(i18n.main)

import CountdownTimer from './countdown-timer'
import { CountdownNotifier } from 'views/utils/notifiers'

class CountdownLabel extends Component {
  getLabelStyle = (timeRemaining, isLSC) => {
    return (
      (timeRemaining > 600 && isLSC) ? 'danger' :
      (timeRemaining > 600) ? 'primary' :
      (timeRemaining > 0) ? 'warning' :
      (timeRemaining == 0) ? 'success' :
      'default'
    )
  }
  constructor(props) {
    super(props)
    this.notifier = new CountdownNotifier()
    this.state = {
      style: this.getLabelStyle(CountdownTimer.getTimeRemaining(this.props.completeTime, this.props.isLSC)),
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.completeTime != this.props.completeTime) {
      this.setState({
        style: this.getLabelStyle(CountdownTimer.getTimeRemaining(nextProps.completeTime), nextProps.isLSC),
      })
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.completeTime !== this.props.completeTime || nextState.style !== this.state.style
  }
  tick = (timeRemaining) => {
    if (this.props.completeTime >= 0)
      this.tryNotify() 
    const style = this.getLabelStyle(timeRemaining, this.props.isLSC)
    if (style !== this.state.style)
      this.setState({style: style})
  }
  static basicNotifyConfig = {
    icon: join(ROOT, 'assets', 'img', 'operation', 'build.png'),
    type: 'construction',
    title: __('Construction'),
    message: (names) => `${joinString(names, ', ')} ${__('built')}`,
  }
  tryNotify = () => {
    this.notifier.tryNotify({
      ...CountdownLabel.basicNotifyConfig,
      args: this.props.shipName,
      completeTime: this.props.completeTime,
    })
  }
  render() {
    return (
      <Label className="kdock-timer" bsStyle={this.state.style}>
      {
        this.props.completeTime >= 0 &&
          <CountdownTimer countdownId={`kdock-${this.props.dockIndex+1}`}
                          completeTime={this.props.completeTime}
                          tickCallback={this.tick} />
      }
      </Label>
    )
  }
}

export default connect(
  (state) => ({
    constructions: state.info.constructions,
    $ships: state.const.$ships,
  })
)(class ConstructionPanel extends Component {
  canNotify: false
  handleResponse = (e) => {
    const {path} = e.detail
    switch (path) {
    case '/kcsapi/api_start2':
      // Do not notify before entering the game
      this.canNotify = false
      break
    case '/kcsapi/api_port/port':
      this.canNotify = true
      break
    }
  }
  componentDidMount() {
    window.addEventListener('game.response', this.handleResponse)
  }
  componentWillUnmount() {
    window.removeEventListener('game.response', this.handleResponse)
  }
  getMaterialImage = (idx) => {
    return <MaterialIcon materialId={idx} className="material-icon" />
  }
  getDockShipName = (dockId, defaultVal) => {
    const id = get(this.props.constructions, [dockId, 'api_created_ship_id'])
    return id ? __(i18n.resources.__(this.props.$ships[id].api_name)) : defaultVal
  }
  render() {
    return (
      <div>
      {
        range(4).map((i) => {
          const dock = get(this.props.constructions, i, {api_state: -1, api_complete_time: 0})
          const isInUse = dock.api_state > 0
          const isLSC = isInUse && dock.api_item1 >= 1000
          const dockName = dock.api_state == -1 ? __('Locked') :
            dock.api_state == 0 ? __('Empty') 
            : this.getDockShipName(i, '???')
          const completeTime = isInUse ? dock.api_complete_time : -1
          const tooltipTitleClassname = isLSC ? {color: '#D9534F', fontWeight: 'bold'} : null
          return (
            <OverlayTrigger key={i} placement='top' overlay={
              isInUse ? (
                <Tooltip id={`kdock-material-${i}`}>
                  {
                    <span style={tooltipTitleClassname}>{dockName}<br /></span>
                  }
                  {this.getMaterialImage(1)} {dock.api_item1}
                  {this.getMaterialImage(2)} {dock.api_item2}
                  {this.getMaterialImage(3)} {dock.api_item3}
                  {this.getMaterialImage(4)} {dock.api_item4}
                  {this.getMaterialImage(7)} {dock.api_item5}
                </Tooltip>
              ) : (
                <noscript />
              )
            }>
              <div className="panel-item kdock-item">
                <span className="kdock-name">{dockName}</span>
                <CountdownLabel
                  dockIndex={i}
                  shipName={dockName}
                  completeTime={completeTime}
                  isLSC={isLSC}
                />
              </div>
            </OverlayTrigger>
          )
        })
      }
      </div>
    )
  }
})
