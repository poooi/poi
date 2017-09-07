import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { join } from 'path-extra'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import { MaterialIcon } from 'views/components/etc/icon'
import { join as joinString, range, get } from 'lodash'
const { ROOT, i18n } = window
const __ = i18n.main.__.bind(i18n.main)

import { CountdownNotifierLabel } from './countdown-timer'

export default connect(
  (state) => ({
    constructions: state.info.constructions,
    $ships: state.const.$ships,
    canNotify: state.misc.canNotify,
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
    case '':
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
  getLabelStyle = ({isLSC}, timeRemaining) => {
    return (
      (timeRemaining > 600 && isLSC) ? 'danger' :
        (timeRemaining > 600) ? 'primary' :
          (timeRemaining > 0) ? 'warning' :
            (timeRemaining == 0) ? 'success' :
              'default'
    )
  }
  static basicNotifyConfig = {
    icon: join(ROOT, 'assets', 'img', 'operation', 'build.png'),
    type: 'construction',
    title: __('Construction'),
    message: (names) => `${joinString(names, ', ')} ${__('built')}`,
  }
  render() {
    const {constructions, canNotify} = this.props
    return (
      <div>
        {
          range(4).map((i) => {
            const dock = get(constructions, i, {api_state: -1, api_complete_time: 0})
            const isInUse = dock.api_state > 0
            const isLSC = isInUse && dock.api_item1 >= 1000
            const dockName = dock.api_state == -1 ? __('Locked') :
              dock.api_state == 0 ? __('Empty')
                : this.getDockShipName(i, '???')
            const completeTime = isInUse ? dock.api_complete_time : -1
            const tooltipTitleClassname = isLSC ? {color: '#D9534F', fontWeight: 'bold'} : null
            return (
              <OverlayTrigger key={i} placement='top' overlay={
                <Tooltip id={`kdock-material-${i}`} style={!isInUse && {display: 'none'}}>
                  {
                    <span style={tooltipTitleClassname}>{dockName}<br /></span>
                  }
                  {this.getMaterialImage(1)} {dock.api_item1}
                  {this.getMaterialImage(2)} {dock.api_item2}
                  {this.getMaterialImage(3)} {dock.api_item3}
                  {this.getMaterialImage(4)} {dock.api_item4}
                  {this.getMaterialImage(7)} {dock.api_item5}
                </Tooltip>
              }>
                <div className="panel-item kdock-item">
                  <span className="kdock-name">{dockName}</span>
                  <CountdownNotifierLabel
                    timerKey={`kdock-${i+1}`}
                    completeTime={completeTime}
                    isLSC={isLSC}
                    getLabelStyle={this.getLabelStyle}
                    getNotifyOptions={() => canNotify && (completeTime >= 0) && {
                      ...this.constructor.basicNotifyConfig,
                      args: dockName,
                      completeTime: completeTime,
                    }}
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
