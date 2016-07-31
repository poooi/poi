import { OverlayTrigger, Tooltip, Label } from 'react-bootstrap'
import { join } from 'path-extra'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import { MaterialIcon } from 'views/components/etc/icon'
import { range, get } from 'lodash'
const { ROOT, _, i18n } = window
const __ = i18n.main.__.bind(i18n.main)

import CountdownTimer from './countdown-timer'
class CountdownLabel extends Component {
  getLabelStyle = (timeRemaining, isLSC) => {
    if (timeRemaining > 600 && isLSC)
      return 'danger'
    else if (timeRemaining > 600)
      return 'primary'
    else if (timeRemaining > 0)
      return 'warning'
    else if (timeRemaining == 0)
      return 'success'
    else
      return 'default'
  }
  constructor(props) {
    super(props)
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
    const style = this.getLabelStyle(timeRemaining, this.props.isLSC)
    if (style !== this.state.style)
      this.setState({style: style})
  }
  render() {
    return (
      <Label className="kdock-timer" bsStyle={this.state.style}>
      {
        this.props.completeTime >= 0 &&
          <CountdownTimer countdownId={`kdock-${this.props.dockIndex+1}`}
                          completeTime={this.props.completeTime}
                          tickCallback={this.tick}
                          completeCallback={this.props.notify} />
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
  constructionIcon = () => {
    return join(ROOT, 'assets', 'img', 'operation', 'build.png')
  }
  notify = () => {
    if (!this.canNotify)
      return
    // Notify all completed ships
    const completedShips = this.state.docks.filter(
      (dock) => 0 <= dock.completeTime < Date.now() + 1000
    ).map(
      (dock) => i18n.resources.__(dock.name)
    ).join(', ')
    window.notify(`${completedShips} ${__('built')}`, {
      type: 'construction',
      title: __("Construction"),
      icon: this.constructionIcon,
    })
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
            : __(i18n.resources.__(this.props.$ships[dock.api_created_ship_id].api_name))
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
                <CountdownLabel dockIndex={i}
                                completeTime={completeTime}
                                isLSC={isLSC}
                                notify={completeTime > 0 ? _.once(this.notify) : null} />
              </div>
            </OverlayTrigger>
          )
        })
      }
      </div>
    )
  }
})
