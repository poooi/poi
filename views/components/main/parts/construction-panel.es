import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { join } from 'path-extra'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import { MaterialIcon } from 'views/components/etc/icon'
import { join as joinString, range, get } from 'lodash'
import FA from 'react-fontawesome'
import { translate } from 'react-i18next'
import i18next from 'views/env-parts/i18next'

import { Avatar } from 'views/components/etc/avatar'
import { CountdownNotifierLabel } from './countdown-timer'

import '../assets/construction-panel.css'

const EmptyDock = ({ state }) => (
  <div className="empty-dock">
    <FA name={state === 0 ? 'inbox' : 'lock'} />
  </div>
)

const getPanelDimension = width => {
  width = width / window.getStore('config.poi.zoomLevel', 1)
  if (width > 700) {
    return 4
  }
  if (width > 350) {
    return 2
  }
  return 1
}

@translate(['main'])
@connect((state) => ({
  constructions: state.info.constructions,
  $ships: state.const.$ships,
  canNotify: state.misc.canNotify,
  enableAvatar: get(state, 'config.poi.enableAvatar', true),
  dimension: getPanelDimension(get(state, 'layout.combinedpane.width', 250)),
}))
export class ConstructionPanel extends Component {
  getMaterialImage = (idx) => {
    return <MaterialIcon materialId={idx} className="material-icon" />
  }
  getDockShipName = (dockId, defaultVal) => {
    const id = get(this.props.constructions, [dockId, 'api_created_ship_id'])
    return id ? this.props.t(`resources:${ this.props.$ships[id].api_name }`) : defaultVal
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
    icon: join(window.ROOT, 'assets', 'img', 'operation', 'build.png'),
    type: 'construction',
    title: i18next.t('main:Construction'),
    message: (names) => `${joinString(names, ', ')} ${i18next.t('main:built')}`,
  }
  render() {
    const {constructions, canNotify, enableAvatar, dimension} = this.props
    return (
      <>
        {
          range(4).map((i) => {
            const dock = get(constructions, i, {api_state: -1, api_complete_time: 0})
            const isInUse = dock.api_state > 0
            const isLSC = isInUse && dock.api_item1 >= 1000
            const dockName = dock.api_state == -1 ? this.props.t('main:Locked') :
              dock.api_state == 0 ? this.props.t('main:Empty')
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
                <div className="panel-item kdock-item" style={{ flexBasis: `${100 / dimension}%` }}>
                  {
                    enableAvatar &&
                    <>
                      {
                        dock.api_state > 0
                          ? <Avatar height={20} mstId={get(constructions, [i, 'api_created_ship_id'])} />
                          : <EmptyDock state={dock.api_state} />
                      }
                    </>
                  }
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
      </>
    )
  }
}
